import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import { NextRequest } from "next/server";

import { proxy } from "@/proxy";
import { DonationStatus } from "@/generated/prisma/client";
import {
  createAdminSession,
  createDonorSession,
  verifyAdminSession,
  verifyDonorSession,
} from "@/lib/auth";
import { getSafeNextDonationStatus } from "@/lib/donation-status";
import {
  detectFileType,
  matchesExpectedExtension,
} from "@/lib/file-signature";
import {
  RATE_LIMITS,
  buildRateLimitKey,
  consumeRateLimit,
  getRateLimitBucketCount,
  resetRateLimitStore,
} from "@/lib/rate-limit";
import {
  firstHeaderValue,
  getClientIp,
  hostFromUrl,
  isCrossSiteOrigin,
} from "@/lib/request-security";
import { timingSafeEqualString } from "@/lib/secrets";

process.env.AUTH_SECRET = "security-test-secret-with-32-characters";

test.beforeEach(() => {
  resetRateLimitStore();
});

test("timingSafeEqualString matches equal secrets only", () => {
  assert.equal(timingSafeEqualString("secret-value", "secret-value"), true);
  assert.equal(timingSafeEqualString("secret-value", "secret-valuf"), false);
  assert.equal(timingSafeEqualString("short", "a-much-longer-secret"), false);
  assert.equal(timingSafeEqualString("", ""), true);
  assert.equal(timingSafeEqualString(null, "secret"), false);
  assert.equal(timingSafeEqualString("secret", undefined), false);
});

test("rate limit allows requests up to the limit then blocks", () => {
  const rule = { limit: 3, windowMs: 1_000 };
  const now = 1_000_000;

  assert.equal(
    consumeRateLimit({ key: "ip:1", rule, now }).allowed,
    true,
  );
  assert.equal(
    consumeRateLimit({ key: "ip:1", rule, now }).allowed,
    true,
  );

  const third = consumeRateLimit({ key: "ip:1", rule, now });
  assert.equal(third.allowed, true);
  assert.equal(third.remaining, 0);

  const blocked = consumeRateLimit({ key: "ip:1", rule, now });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.retryAfterSeconds > 0);
});

test("rate limit resets after the window expires", () => {
  const rule = { limit: 1, windowMs: 1_000 };

  assert.equal(consumeRateLimit({ key: "ip:2", rule, now: 1_000 }).allowed, true);
  assert.equal(consumeRateLimit({ key: "ip:2", rule, now: 1_500 }).allowed, false);
  assert.equal(consumeRateLimit({ key: "ip:2", rule, now: 2_001 }).allowed, true);
});

test("rate limit buckets are isolated per key", () => {
  const rule = { limit: 1, windowMs: 60_000 };

  assert.equal(consumeRateLimit({ key: "admin:a", rule, now: 1 }).allowed, true);
  assert.equal(consumeRateLimit({ key: "admin:a", rule, now: 2 }).allowed, false);
  assert.equal(consumeRateLimit({ key: "admin:b", rule, now: 2 }).allowed, true);
});

test("rate limit store stays bounded when identifiers rotate", () => {
  const rule = { limit: 1, windowMs: 600_000 };

  for (let index = 0; index < 10_050; index += 1) {
    consumeRateLimit({ key: `rotate:${index}`, rule, now: 1_000 });
  }

  assert.ok(getRateLimitBucketCount() <= 10_000);
});

test("rate limit keys fall back to unknown instead of merging scopes", () => {
  assert.equal(buildRateLimitKey("donation:create", null), "donation:create:unknown");
  assert.equal(
    buildRateLimitKey("donation:create", "203.0.113.10"),
    "donation:create:203.0.113.10",
  );
  assert.ok(RATE_LIMITS.adminLogin.limit > 0);
});

test("client IP prefers Cloudflare then the first forwarded value", () => {
  assert.equal(
    getClientIp(
      new Request("http://localhost", {
        headers: {
          "cf-connecting-ip": "198.51.100.7",
          "x-forwarded-for": "203.0.113.1, 203.0.113.2",
        },
      }),
    ),
    "198.51.100.7",
  );

  assert.equal(
    getClientIp(
      new Request("http://localhost", {
        headers: { "x-forwarded-for": "203.0.113.1, 203.0.113.2" },
      }),
    ),
    "203.0.113.1",
  );

  assert.equal(
    getClientIp(
      new Request("http://localhost", {
        headers: { "x-real-ip": "192.0.2.9" },
      }),
    ),
    "192.0.2.9",
  );

  assert.equal(getClientIp(new Request("http://localhost")), null);
});

test("cross-site origin detection rejects foreign origins only", () => {
  const allowedHosts = ["berkahkaryo.my.id", "localhost:3000"];

  assert.equal(
    isCrossSiteOrigin({ origin: null, allowedHosts }),
    false,
  );
  assert.equal(
    isCrossSiteOrigin({
      origin: "https://berkahkaryo.my.id",
      allowedHosts,
    }),
    false,
  );
  assert.equal(
    isCrossSiteOrigin({
      origin: "https://evil.example",
      allowedHosts,
    }),
    true,
  );
  assert.equal(
    isCrossSiteOrigin({ origin: "null", allowedHosts }),
    true,
  );
  assert.equal(
    isCrossSiteOrigin({ origin: "not-a-url", allowedHosts }),
    true,
  );
  assert.equal(
    isCrossSiteOrigin({ origin: "https://evil.example", allowedHosts: [] }),
    false,
  );
});

test("header and URL helpers normalize values", () => {
  assert.equal(firstHeaderValue("a, b"), "a");
  assert.equal(firstHeaderValue("  "), null);
  assert.equal(firstHeaderValue(null), null);
  assert.equal(hostFromUrl("https://berkahkaryo.my.id/path"), "berkahkaryo.my.id");
  assert.equal(hostFromUrl("not-a-url"), null);
  assert.equal(hostFromUrl(null), null);
});

test("file signatures are detected from bytes, not MIME type", () => {
  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const webp = Uint8Array.from([
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ]);
  const pdf = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
  const html = new TextEncoder().encode("<html>not an image</html>");

  assert.equal(detectFileType(jpeg), "jpg");
  assert.equal(detectFileType(png), "png");
  assert.equal(detectFileType(webp), "webp");
  assert.equal(detectFileType(pdf), "pdf");
  assert.equal(detectFileType(html), null);

  assert.equal(matchesExpectedExtension(jpeg, "jpg"), true);
  assert.equal(matchesExpectedExtension(html, "jpg"), false);
  assert.equal(matchesExpectedExtension(jpeg, "png"), false);
});

test("admin sessions reject tampering, escalation and expiry", () => {
  const session = createAdminSession("admin@example.com");
  const payload = verifyAdminSession(session);
  assert.equal(payload?.email, "admin@example.com");
  assert.equal(payload?.role, "admin");

  assert.equal(verifyAdminSession(`${session}tampered`), null);
  assert.equal(verifyAdminSession(undefined), null);

  const donorSession = createDonorSession({
    userId: "user-1",
    email: "donor@example.com",
  });
  assert.equal(verifyAdminSession(donorSession), null);
  assert.equal(verifyDonorSession(session), null);

  const expiredPayload = Buffer.from(
    JSON.stringify({
      email: "admin@example.com",
      role: "admin",
      expiresAt: 1,
    }),
  ).toString("base64url");
  const expiredSignature = createHmac("sha256", process.env.AUTH_SECRET ?? "")
    .update(expiredPayload)
    .digest("base64url");
  assert.equal(
    verifyAdminSession(`${expiredPayload}.${expiredSignature}`),
    null,
  );

  const escalatedPayload = Buffer.from(
    JSON.stringify({
      email: "donor@example.com",
      role: "donor",
      expiresAt: Math.floor(Date.now() / 1000) + 60,
    }),
  ).toString("base64url");
  const escalatedSignature = createHmac("sha256", process.env.AUTH_SECRET ?? "")
    .update(escalatedPayload)
    .digest("base64url");
  assert.equal(
    verifyAdminSession(`${escalatedPayload}.${escalatedSignature}`),
    null,
  );
});

test("proxy rejects cross-site admin mutations before auth", async () => {
  const request = new NextRequest("http://localhost/api/admin/expenses", {
    method: "POST",
    headers: {
      host: "localhost",
      origin: "https://evil.example",
    },
  });

  const response = await proxy(request);
  assert.equal(response.status, 403);
});

test("proxy lets same-origin admin mutations reach the auth guard", async () => {
  const request = new NextRequest("http://localhost/api/admin/expenses", {
    method: "POST",
    headers: {
      host: "localhost",
      origin: "http://localhost",
    },
  });

  const response = await proxy(request);
  assert.equal(response.status, 401);
});

test("proxy rejects guests on admin API reads", async () => {
  const request = new NextRequest("http://localhost/api/admin/expenses", {
    method: "GET",
    headers: { host: "localhost" },
  });

  const response = await proxy(request);
  assert.equal(response.status, 401);
});

test("proxy defers to the app when a Better Auth session cookie exists", async () => {
  const request = new NextRequest("http://localhost/api/admin/expenses", {
    method: "POST",
    headers: {
      host: "localhost",
      origin: "http://localhost",
      cookie: "better-auth.session_token=opaque-session-value",
    },
  });

  const response = await proxy(request);
  assert.equal(response.status, 200);
});

test("settled donations are never downgraded by a replayed webhook", () => {
  assert.equal(
    getSafeNextDonationStatus(
      DonationStatus.settlement,
      DonationStatus.settlement,
    ),
    DonationStatus.settlement,
  );
  assert.equal(
    getSafeNextDonationStatus(DonationStatus.settlement, DonationStatus.pending),
    DonationStatus.settlement,
  );
  assert.equal(
    getSafeNextDonationStatus(DonationStatus.pending, DonationStatus.settlement),
    DonationStatus.settlement,
  );
  assert.equal(
    getSafeNextDonationStatus(DonationStatus.settlement, DonationStatus.refund),
    DonationStatus.refund,
  );
});
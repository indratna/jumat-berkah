import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server";

import {
  DELETE,
  GET,
  PATCH,
  POST,
  PUT,
} from "@/app/api/csp-report/route";
import nextConfig from "../../next.config";
import {
  CSP_REPORT_ENDPOINT_NAME,
  CSP_REPORT_PATH,
  buildCspReportOnlyPolicy,
  buildReportingEndpointsHeader,
} from "@/lib/csp";
import {
  DEDUPE_TTL_MS,
  MAX_CSP_REPORT_BODY_BYTES,
  MAX_DEDUPE_ENTRIES,
  createCspReportDeduplicator,
  normalizeCspReports,
  sanitizeUri,
} from "@/lib/csp-report";
import {
  RATE_LIMITS,
  resetRateLimitStore,
} from "@/lib/rate-limit";

test.beforeEach(() => {
  resetRateLimitStore();
});

test("policy is deterministic and contains the report directives", () => {
  const first = buildCspReportOnlyPolicy({ isDev: false });
  const second = buildCspReportOnlyPolicy({ isDev: false });

  assert.equal(first, second);
  assert.match(first, /default-src 'self'/);
  assert.match(first, /base-uri 'self'/);
  assert.match(first, /object-src 'none'/);
  assert.match(first, /frame-ancestors 'none'/);
  assert.match(first, /form-action 'self'/);
  assert.match(first, /frame-src https:\/\/app\.midtrans\.com/);
  assert.match(first, new RegExp(`report-uri ${CSP_REPORT_PATH}`));
  assert.match(first, new RegExp(`report-to ${CSP_REPORT_ENDPOINT_NAME}`));
  assert.equal(first.includes("unsafe-eval"), false);
});

test("development policy allows HMR eval but production never does", () => {
  const dev = buildCspReportOnlyPolicy({ isDev: true });
  const prod = buildCspReportOnlyPolicy({ isDev: false });

  assert.match(dev, /script-src[^;]*'unsafe-eval'/);
  assert.equal(prod.includes("unsafe-eval"), false);
});

test("reporting endpoint header points to the collector path", () => {
  assert.equal(
    buildReportingEndpointsHeader(),
    `${CSP_REPORT_ENDPOINT_NAME}="${CSP_REPORT_PATH}"`,
  );
});

test("next.config serves both reporting headers on every route", async () => {
  const headersFn = nextConfig.headers;
  assert.ok(headersFn);

  const rules = await headersFn();
  const headers = new Map(
    rules.flatMap((rule) =>
      rule.headers.map((header) => [header.key.toLowerCase(), header.value]),
    ),
  );

  assert.match(
    headers.get("content-security-policy-report-only") ?? "",
    /report-uri \/api\/csp-report/,
  );
  assert.equal(
    headers.get("reporting-endpoints"),
    'csp-endpoint="/api/csp-report"',
  );
});

test("sanitizeUri drops query strings and fragments", () => {
  assert.equal(
    sanitizeUri("https://donasi.example/donasi/status/JB-1?email=a@b.test#x"),
    "https://donasi.example/donasi/status/JB-1",
  );
  assert.equal(sanitizeUri("inline"), "inline");
  assert.equal(sanitizeUri("data:text/html,secret"), "data:");
  assert.equal(sanitizeUri("blob:https://app.example/id"), "blob:");
  assert.equal(sanitizeUri(undefined), "");
  assert.equal(sanitizeUri("x\n?token=1"), "x");
});

test("normalizes modern CSP reports", () => {
  const body = JSON.stringify([
    {
      type: "csp-violation",
      url: "https://donasi.example/donasi?token=secret",
      body: {
        effectiveDirective: "frame-src",
        blockedURL: "https://app.midtrans.com/snap/v2/vtweb/abc",
        documentURL: "https://donasi.example/donasi?email=donor@example.com",
        disposition: "report",
        lineNumber: 12,
      },
    },
  ]);

  const reports = normalizeCspReports(body);

  assert.deepEqual(reports, [
    {
      directive: "frame-src",
      blockedUri: "https://app.midtrans.com/snap/v2/vtweb/abc",
      documentUri: "https://donasi.example/donasi",
      disposition: "report",
      lineNumber: 12,
    },
  ]);
});

test("normalizes legacy csp-report envelopes and skips non-CSP entries", () => {
  const body = JSON.stringify({
    "csp-report": {
      "violated-directive": "script-src-elem",
      "blocked-uri": "https://cdn.example/script.js",
      "document-uri": "https://donasi.example/donasi?token=secret",
      "line-number": 7,
    },
  });

  const reports = normalizeCspReports(body);

  assert.equal(reports.length, 1);
  assert.equal(reports[0]?.directive, "script-src-elem");
  assert.equal(reports[0]?.blockedUri, "https://cdn.example/script.js");
  assert.equal(reports[0]?.documentUri, "https://donasi.example/donasi");

  const mixed = JSON.stringify([
    { type: "deprecation", body: { effectiveDirective: "ignored" } },
    "not-an-object",
    { type: "csp-violation", body: { effectiveDirective: "style-src" } },
  ]);

  assert.deepEqual(
    normalizeCspReports(mixed).map((report) => report.directive),
    ["style-src"],
  );
});

test("invalid JSON and unrelated payloads produce no reports", () => {
  assert.deepEqual(normalizeCspReports("not-json"), []);
  assert.deepEqual(normalizeCspReports("{}"), []);
  assert.deepEqual(normalizeCspReports("[]"), []);
  assert.deepEqual(normalizeCspReports("null"), []);
});

test("dedupulator keeps each directive/blocked pair once inside its window", () => {
  const deduplicator = createCspReportDeduplicator();
  const report = {
    directive: "img-src",
    blockedUri: "https://cdn.example/a.png",
    documentUri: "https://donasi.example/",
    disposition: "report",
    lineNumber: null,
  };

  assert.equal(deduplicator.shouldLog(report, 1_000), true);
  assert.equal(deduplicator.shouldLog(report, 2_000), false);
  assert.equal(
    deduplicator.shouldLog(report, 1_000 + DEDUPE_TTL_MS + 1),
    true,
  );

  deduplicator.reset();
  assert.equal(deduplicator.size(), 0);
  assert.equal(deduplicator.shouldLog(report, 3_000), true);
});

test("dedupulator stays bounded and evicts the oldest entry", () => {
  const deduplicator = createCspReportDeduplicator();
  const now = 500_000;

  for (let index = 0; index < MAX_DEDUPE_ENTRIES + 10; index += 1) {
    deduplicator.shouldLog(
      {
        directive: "script-src-elem",
        blockedUri: `https://cdn.example/${index}.js`,
        documentUri: "https://donasi.example/",
        disposition: "report",
        lineNumber: null,
      },
      now,
    );
  }

  assert.equal(deduplicator.size(), MAX_DEDUPE_ENTRIES);
});

function buildReportRequest(body: string, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/csp-report", {
    method: "POST",
    headers: { "content-type": "application/csp-report", ...headers },
    body,
  });
}

test("collector accepts reports with 204", async () => {
  const response = await POST(
    buildReportRequest(
      JSON.stringify({
        "csp-report": {
          "effective-directive": "script-src-elem",
          "blocked-uri": "https://cdn.example/script.js?token=secret",
        },
      }),
    ),
  );

  assert.equal(response.status, 204);
});

test("collector answers 204 for malformed payloads and 413 for oversized ones", async () => {
  assert.equal((await POST(buildReportRequest("{broken"))).status, 204);

  const oversized = JSON.stringify({
    "csp-report": { "blocked-uri": "x".repeat(MAX_CSP_REPORT_BODY_BYTES) },
  });
  assert.equal((await POST(buildReportRequest(oversized))).status, 413);
});

test("collector rejects non-POST methods with 405 and Allow: POST", async () => {
  for (const handler of [GET, PUT, PATCH, DELETE]) {
    const response = await handler();
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST");
  }
});

test("collector rate limits bursts with Retry-After", async () => {
  for (let index = 0; index < RATE_LIMITS.cspReport.limit; index += 1) {
    const response = await POST(buildReportRequest("{}"));
    assert.equal(response.status, 204);
  }

  const blocked = await POST(buildReportRequest("{}"));
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);
});

#!/usr/bin/env node
/**
 * Preflight smoke checks for a deployed Jumat Berkah instance.
 *
 * Safe by default: the default checks only read public pages and probe guards
 * with requests that are rejected before any handler runs. Write-path probes
 * (admin origin guard, rate limiting) are opt-in because they touch production
 * endpoints.
 *
 * Usage:
 *   node scripts/security-smoke.mjs --base-url https://example.com
 *   npm run smoke:security -- --base-url https://example.com --json
 *
 * No secrets are read or printed.
 */
import { parseArgs } from "node:util";

const USER_AGENT = "jumat-berkah-security-smoke/1.0";
const RATE_LIMIT_ATTEMPTS = 12;

const HELP = `Jumat Berkah preflight smoke checks

Usage:
  node scripts/security-smoke.mjs --base-url <url> [options]

Options:
  --base-url <url>   Target base URL (or set SMOKE_BASE_URL). Required.
  --mutations        Also probe the admin API origin guard (POST requests are
                     rejected before the handler, so no data changes).
  --rate-limit       Also probe the donation rate limit. This can block the
                     calling IP from donating for 10 minutes. Off by default.
  --timeout <ms>     Per-request timeout. Default: 10000.
  --json             Print a JSON report instead of a text summary.
  -h, --help         Show this help.

Exit codes: 0 all checks passed, 1 at least one check failed, 2 usage error.`;

let values;

try {
  ({ values } = parseArgs({
    options: {
      "base-url": { type: "string" },
      mutations: { type: "boolean", default: false },
      "rate-limit": { type: "boolean", default: false },
      timeout: { type: "string", default: "10000" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  }));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error("Run with --help for usage.");
  process.exit(2);
}

if (values.help) {
  console.log(HELP);
  process.exit(0);
}

const rawBaseUrl = values["base-url"] ?? process.env.SMOKE_BASE_URL ?? "";
const baseUrl = rawBaseUrl.trim().replace(/\/+$/, "");
const timeoutMs = Number.parseInt(values.timeout ?? "10000", 10);

if (!baseUrl) {
  fail("Missing --base-url (or SMOKE_BASE_URL).");
}

if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  fail("--timeout must be a positive number of milliseconds.");
}

let parsedBaseUrl;

try {
  parsedBaseUrl = new URL(baseUrl);
} catch {
  fail(`Invalid base URL: ${baseUrl}`);
}

if (parsedBaseUrl.protocol !== "http:" && parsedBaseUrl.protocol !== "https:") {
  fail("Base URL must use http or https.");
}

const isHttps = parsedBaseUrl.protocol === "https:";
const results = [];

await runDefaultChecks();

if (values.mutations) {
  await runGuardChecks();
} else {
  skip("admin mutation origin guard", "re-run with --mutations");
}

if (values["rate-limit"]) {
  await runRateLimitCheck();
} else {
  skip("donation rate limit", "re-run with --rate-limit");
}

report();

function fail(message) {
  console.error(message);
  console.error("Run with --help for usage.");
  process.exit(2);
}

async function runDefaultChecks() {
  await check("landing page", async () => {
    const response = await request("/");
    expectStatus(response, 200);
    const body = await response.text();
    expectIncludes(body, "<title", "landing page has no <title>");
    return "200 OK";
  });

  await check("login page", async () => {
    const response = await request("/login");
    expectStatus(response, 200);
    return "200 OK";
  });

  await check("public report", async () => {
    const response = await request("/laporan");
    expectStatus(response, 200);
    return "200 OK";
  });

  await check("robots.txt", async () => {
    const response = await request("/robots.txt");
    expectStatus(response, 200);
    const body = await response.text();
    expectIncludes(body, "Disallow: /admin", "robots.txt does not disallow /admin");
    return "200 OK, /admin disallowed";
  });

  await check("sitemap.xml", async () => {
    const response = await request("/sitemap.xml");
    expectStatus(response, 200);
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("xml")) {
      throw new Error(`unexpected content-type: ${type || "(empty)"}`);
    }
    return "200 OK";
  });

  await check("security headers", async () => {
    const response = await request("/");
    const expectations = [
      ["x-content-type-options", "nosniff"],
      ["x-frame-options", "DENY"],
      ["referrer-policy", "strict-origin-when-cross-origin"],
      ["permissions-policy", "camera=()"],
    ];

    for (const [name, expected] of expectations) {
      const value = response.headers.get(name);
      if (!value || !value.includes(expected)) {
        throw new Error(`${name} expected to include "${expected}", got "${value ?? "(missing)"}"`);
      }
    }

    if (response.headers.get("x-powered-by")) {
      throw new Error("x-powered-by header should be removed");
    }

    if (isHttps) {
      const hsts = response.headers.get("strict-transport-security");
      if (!hsts || !hsts.includes("max-age=")) {
        throw new Error("strict-transport-security missing on HTTPS");
      }
    }

    return isHttps ? "present (including HSTS)" : "present (HSTS skipped on HTTP)";
  });

  await check("guest admin API", async () => {
    const response = await request("/api/admin/expenses");

    // 401 is the intended contract. A 405 means the request reached a POST-only
    // route before an auth guard; still a refusal, but worth reporting as such.
    if (response.status !== 401 && response.status !== 405) {
      throw new Error(`expected 401 (or 405), got ${response.status}`);
    }

    return response.status === 401
      ? "401 Unauthorized"
      : "405 Method Not Allowed (guest refused)";
  });

  await check("admin page guard", async () => {
    const response = await request("/admin");
    const location = response.headers.get("location");

    if (response.status >= 300 && response.status < 400) {
      if (!location || !new URL(location, baseUrl).pathname.startsWith("/login")) {
        throw new Error(`redirected to unexpected location: ${location ?? "(none)"}`);
      }
      return `${response.status} redirect to login`;
    }

    if (response.status === 200) {
      const body = await response.text();
      if (!/Masuk dashboard admin/i.test(body)) {
        throw new Error("guest received a 200 without the admin login page");
      }
      return "login page served";
    }

    throw new Error(`expected a redirect or login page, got ${response.status}`);
  });

  await check("unknown order lookup", async () => {
    const response = await request("/api/donations/JB-20260101-SMOKE000");
    expectStatus(response, 404);
    return "404 Not Found";
  });
}

async function runGuardChecks() {
  await check("foreign origin blocked", async () => {
    const response = await request("/api/admin/expenses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://smoke.invalid",
      },
      body: "{}",
    });
    expectStatus(response, 403);
    return "403 Forbidden";
  });

  await check("no-origin request still reaches auth", async () => {
    const response = await request("/api/admin/expenses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    expectStatus(response, 401);
    return "401 Unauthorized";
  });
}

async function runRateLimitCheck() {
  console.warn(
    "WARNING: --rate-limit sends repeated invalid donation requests. The calling IP may be blocked from creating donations for 10 minutes.",
  );

  await check("donation rate limit", async () => {
    const statuses = [];
    let retryAfter = null;
    let blockedAt = 0;

    for (let attempt = 0; attempt < RATE_LIMIT_ATTEMPTS; attempt += 1) {
      const response = await request("/api/donations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      statuses.push(response.status);

      if (response.status === 429) {
        blockedAt = attempt + 1;
        retryAfter = response.headers.get("retry-after");
        break;
      }

      if (response.status >= 500) {
        throw new Error(`unexpected ${response.status} while probing the limiter`);
      }
    }

    if (!blockedAt) {
      throw new Error(
        `no 429 within ${RATE_LIMIT_ATTEMPTS} attempts (statuses: ${statuses.join(", ")})`,
      );
    }

    const seconds = Number.parseInt(retryAfter ?? "", 10);

    if (!Number.isFinite(seconds) || seconds <= 0) {
      throw new Error(`429 without a usable Retry-After header: ${retryAfter ?? "(missing)"}`);
    }

    return `429 after ${blockedAt} attempts, Retry-After ${seconds}s`;
  });
}

async function check(name, run) {
  try {
    const detail = await run();
    results.push({ name, status: "pass", detail });
  } catch (error) {
    results.push({
      name,
      status: "fail",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

function skip(name, reason) {
  results.push({ name, status: "skip", detail: reason });
}

async function request(pathname, init = {}) {
  const url = new URL(pathname, `${baseUrl}/`);

  return fetch(url, {
    ...init,
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "user-agent": USER_AGENT,
      ...init.headers,
    },
  });
}

function expectStatus(response, expected) {
  if (response.status !== expected) {
    throw new Error(`expected ${expected}, got ${response.status}`);
  }
}

function expectIncludes(body, expected, message) {
  if (!body.includes(expected)) {
    throw new Error(message);
  }
}

function report() {
  const passed = results.filter((item) => item.status === "pass").length;
  const failed = results.filter((item) => item.status === "fail").length;
  const skipped = results.filter((item) => item.status === "skip").length;

  if (values.json) {
    console.log(
      JSON.stringify(
        {
          baseUrl,
          generatedAt: new Date().toISOString(),
          passed,
          failed,
          skipped,
          results,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`Preflight smoke: ${baseUrl}`);

    for (const item of results) {
      console.log(`${item.status.toUpperCase().padEnd(4)} ${item.name} - ${item.detail}`);
    }

    console.log(`\n${passed} passed, ${failed} failed, ${skipped} skipped`);
  }

  process.exitCode = failed > 0 ? 1 : 0;
}
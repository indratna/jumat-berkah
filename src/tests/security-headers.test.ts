import assert from "node:assert/strict";
import test from "node:test";

import nextConfig from "../../next.config";
import robots from "../app/robots";
import sitemap from "../app/sitemap";

async function collectHeaders(): Promise<Map<string, string>> {
  const headersFn = nextConfig.headers;
  assert.ok(headersFn, "next.config harus mendefinisikan headers()");

  const rules = await headersFn();
  assert.ok(rules.length > 0, "minimal satu aturan header");

  const headers = new Map<string, string>();
  for (const rule of rules) {
    for (const header of rule.headers) {
      headers.set(header.key.toLowerCase(), header.value);
    }
  }

  return headers;
}

test("respons aplikasi memakai header keamanan dasar", async () => {
  const headers = await collectHeaders();

  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("x-frame-options"), "DENY");
  assert.equal(
    headers.get("referrer-policy"),
    "strict-origin-when-cross-origin",
  );
  assert.match(headers.get("permissions-policy") ?? "", /camera=\(\)/);
  assert.match(
    headers.get("strict-transport-security") ?? "",
    /max-age=31536000/,
  );
});

test("header x-powered-by dimatikan", () => {
  assert.equal(nextConfig.poweredByHeader, false);
});

test("robots melarang area admin dan api", () => {
  const config = robots();
  const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
  assert.ok(rules);

  const disallow = Array.isArray(rules.disallow)
    ? rules.disallow
    : [rules.disallow];

  assert.ok(disallow.includes("/admin"));
  assert.ok(disallow.includes("/api/"));
  const sitemapUrl = Array.isArray(config.sitemap)
    ? config.sitemap[0]
    : config.sitemap;
  assert.ok(sitemapUrl?.endsWith("/sitemap.xml"));
});

test("sitemap hanya memuat halaman publik yang diindeks", () => {
  const paths = sitemap()
    .map((entry) => new URL(entry.url).pathname)
    .sort();

  assert.deepEqual(paths, ["/", "/donasi", "/laporan", "/tentang"]);
});
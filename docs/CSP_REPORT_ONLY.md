# Content-Security-Policy (Report-Only)

This project serves a **report-only** Content-Security-Policy. The browser
evaluates the policy and reports what it *would* block, but blocks nothing.
That makes it safe to run alongside payment popups and third-party scripts
while we collect real evidence.

Two response headers are set for every route in `next.config.ts`:

```txt
Content-Security-Policy-Report-Only: ...
Reporting-Endpoints: csp-endpoint="/api/csp-report"
```

The policy itself is built by `src/lib/csp.ts`, so it can be unit tested and
changed in one place.

## What the baseline allows

| Directive | Value | Reason |
|---|---|---|
| `default-src` | `'self'` | Nothing external is allowed unless listed below. |
| `script-src` | `'self'`, `'unsafe-inline'`, Midtrans app origins | Snap is loaded from the Midtrans app domain. Inline is allowed because the App Router emits inline bootstrap scripts; a nonce design is a separate step. |
| `frame-src` | Midtrans app origins | Snap renders its payment UI in a cross-origin frame. |
| `connect-src` | `'self'`, Midtrans app and API origins | Allows the app's own API plus any Snap callbacks. |
| `style-src` | `'self'`, `'unsafe-inline'` | Framework and component styles are injected inline. |
| `img-src` | `'self'`, `data:`, `blob:` | Profile images are served through the app's own image optimizer. |
| `font-src` | `'self'`, `data:` | Fonts are self-hosted. |
| `base-uri`, `object-src`, `frame-ancestors`, `form-action` | locked down | Cheap protections that do not depend on third parties. |

`'unsafe-eval'` is added only in development for Fast Refresh. It is never
present in a production build.

The policy includes both `report-uri` and `report-to` for browser
compatibility: Safari still uses `report-uri`, while Chromium-based browsers
prefer `report-to`.

## What happens to a report

`POST /api/csp-report` is public because browsers send reports without
credentials. It:

- accepts both the modern `application/reports+json` envelope and the legacy
  `application/csp-report` envelope;
- returns `204` for anything it receives, including malformed JSON, so browsers
  do not retry endlessly;
- returns `413` for bodies larger than 16 KB, `429` after 60 reports per
  10 minutes per client IP, and `405` for non-POST methods;
- reduces every URI to origin + path before logging. Query strings and inline
  script samples are discarded because they may contain tokens, email
  addresses, or donor data;
- deduplicates repeated `directive|blocked-uri` pairs for five minutes so one
  page cannot flood the log;
- writes one JSON line to the server log, never to the database.

The collector uses the same best-effort client-IP extraction as the other rate
limits. If the app is ever exposed without a trusted proxy in front of it, that
IP can be spoofed; the 16 KB body cap and deduplication are the backstop in
that case.

Example log line:

```txt
csp-report {"directive":"frame-src","blockedUri":"https://cdn.example/widget.js","documentUri":"https://app.example/donasi","disposition":"report","lineNumber":null}
```

Look for `directive`/`blockedUri` pairs you do not recognise. Expected
Midtrans entries are not a problem. A new, unknown origin deserves
investigation before it is added to the allowlist.

## Adding an allowed origin

1. Confirm the origin belongs to a dependency you actually use.
2. Add it to the relevant list in `src/lib/csp.ts` (app origins, API origins,
   or a new directive).
3. Update the table above.
4. Run `npm test` and `npm run build`.

Do not add `*` or broad schemes. An allowlist that accepts everything produces
no useful reports.

## Path to enforcement

Enforcement is deliberately a later change:

1. Add a per-request nonce in the proxy and pass it through to App Router
   scripts. This forces affected pages to be dynamically rendered, so measure
   the performance cost first.
2. Remove `'unsafe-inline'` from the production policy once every inline
   violation is covered by the nonce.
3. Run a full sandbox and live Midtrans QRIS payment smoke, including the
   popup/iframe and redirect paths.
4. Only then change the header name from
   `Content-Security-Policy-Report-Only` to `Content-Security-Policy`.
5. Keep `report-uri`/`report-to` so genuine blocks are still reported.

Until step 4 is complete, a CSP violation is never the cause of a failed
donation.

## Rollback

Remove the two headers from `next.config.ts`. Nothing else depends on them;
the collector endpoint can stay in place and simply receives no traffic.

## Dependency monitoring

- `.github/dependabot.yml` opens grouped weekly PRs for minor/patch npm and
  GitHub Actions updates, with at most five open PRs per ecosystem. Security
  updates are opened separately by Dependabot.
- The `dependency-review` CI job checks dependency changes in every PR and
  fails on high or critical advisories, in addition to the existing
  `npm audit --omit=dev` step that runs on pushes and PRs.

Dependabot PRs still follow the normal review and validation rules: do not
merge a dependency PR until lint, tests, build, and audit pass.

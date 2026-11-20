# Preflight Smoke Runbook

Use this runbook after a deployment and before announcing a donation campaign.
The script checks that the public app is reachable, that the admin surface is
still guarded, and that the security headers and proxy rules shipped with the
build are actually active.

The checks never read secrets, never create a donation, and never attempt a
login (failed admin logins notify the operator, so the script stays away from
them).

## Requirements

- Node.js 22 or newer on the machine that runs the checks.
- Network access to the deployed base URL.
- Optional: an operator who can read the response of each check.

## Run the safe checks

```bash
npm run smoke:security -- --base-url https://your-domain.example
```

The base URL can also come from an environment variable:

```bash
SMOKE_BASE_URL=https://your-domain.example npm run smoke:security
```

On Windows PowerShell:

```powershell
$env:SMOKE_BASE_URL = "https://your-domain.example"; npm run smoke:security
```

The default run is read-only:

| Check | Expected |
|---|---|
| `GET /` | `200` with an HTML document |
| `GET /login` | `200` |
| `GET /laporan` | `200` |
| `GET /robots.txt` | `200` and `Disallow: /admin` |
| `GET /sitemap.xml` | `200` with an XML content type |
| Security headers on `/` | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`; HSTS only when the base URL is HTTPS; no `X-Powered-By` |
| `GET /api/admin/expenses` as a guest | `401`; `405` is also a refusal (a POST-only route ran before the auth guard), but it means the proxy did not intercept the request |
| `GET /admin` as a guest | redirect to `/login`, or the admin login page without the dashboard shell |
| `GET /api/donations/<unknown-order-id>` | `404`, not `500` |

## Probe the write-path guards

These checks send requests that are rejected before any handler runs, so they
do not change data. They are opt-in because they touch production endpoints.

```bash
npm run smoke:security -- --base-url https://your-domain.example --mutations
```

| Check | Expected |
|---|---|
| `POST /api/admin/expenses` with `Origin: https://smoke.invalid` | `403` |
| `POST /api/admin/expenses` without an `Origin` header | `401` (auth runs, cron/curl still work) |

If the foreign-origin request returns `401` instead of `403`, the admin proxy is
not registered in that build. Rebuild and redeploy; the security tests cover the
same rule.

## Probe the rate limiter

```bash
npm run smoke:security -- --base-url https://your-domain.example --rate-limit
```

The check sends up to twelve invalid donation requests until it sees `429` with
a `Retry-After` header. Invalid requests are rejected by validation, so no
donation is created.

**This blocks the calling IP from creating donations for the rest of the rate
limit window (10 minutes).** Run it from an operator machine, not from a donor
network, and avoid running it during an active campaign.

## Capture evidence

`--json` prints a machine-readable report that can be attached to a deployment
record or a release checklist:

```bash
npm run smoke:security -- --base-url https://your-domain.example --mutations --json \
  > preflight-smoke.json
```

The report contains the base URL, a timestamp, counts, and one entry per check.
It does not contain cookies, tokens, or response bodies.

Exit codes:

- `0` — every executed check passed.
- `1` — at least one check failed.
- `2` — usage error (missing or invalid base URL).

## Troubleshooting

- **`429` on the default checks**: the operator IP is currently rate limited.
  Wait for the window to reset and retry.
- **`/laporan` returns `500`**: the deployment cannot reach the database, or
  migrations have not been applied. Fix the deployment before announcing.
- **Security headers missing**: check that the deployment serves the build from
  this repository and that an upstream proxy is not stripping headers.
- **`/admin` shows the dashboard**: stop and treat it as an incident. The admin
  layout and API guards should never render data for a guest.
- **Connection errors**: confirm the base URL, DNS, and tunnel/reverse proxy
  health before re-running.

## What this does not replace

The script is a smoke test, not a penetration test. Pair it with the layered
checks in `docs/SECURITY_TESTING.md` and a manual review of the payment flow
before handling real money at scale.
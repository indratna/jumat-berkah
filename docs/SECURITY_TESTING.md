# Security Testing

Jumat Berkah handles donations, payment webhooks, admin access, and donor
contact data. Security checks are layered so a regression in one area does not
silently weaken another.

## What runs on every change

```bash
npm ci
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

The same commands run in `.github/workflows/ci.yml` for pushes and pull
requests to `main`. A pull request should not be merged when any of them fails.

## Layer 1 — Supply chain and secrets

| Check | Command | Notes |
|---|---|---|
| Production dependency CVEs | `npm audit --omit=dev --audit-level=high` | CI fails on high or critical findings. |
| Full dependency audit | `npm audit` | Dev-only findings are reviewed but do not block by default. |
| Secret scan | `docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest detect -s /repo` | Run before publishing or rotating credentials. |
| Tracked secret files | `git ls-files | Select-String "\.env"` | Only `.env.example` may be tracked. |

Never commit real `.env` files, provider tokens, database credentials, or
operator notes. Rotate any secret that may have been exposed; see
`SECRET_ROTATION_RUNBOOK.md`.

## Layer 2 — Unit and integration tests

The admin proxy lives at `src/proxy.ts`. Next.js resolves the proxy relative to
the directory that holds the app, so a root-level `proxy.ts` is silently ignored
when routes live in `src/app`. Keep the file next to `src/app`.

`src/tests/security-hardening.test.ts` covers:

- constant-time secret comparison for login codes and cron secrets;
- rate limiting: allow, block, window reset, and key isolation;
- client IP extraction used by rate limits;
- cross-site `Origin` rejection for admin mutations, including the proxy entry
  point itself;
- proxy pass-through when a Better Auth session cookie is present, so Google
  admin logins keep working;
- file signature (magic byte) detection for JPG, PNG, WebP, and PDF;
- admin session tampering, role escalation, expiry, and cross-role rejection;
- webhook replay safety: a settled donation is never downgraded.

Existing tests also cover:

- security headers, `robots.txt`, and `sitemap.xml`
  (`src/tests/security-headers.test.ts`);
- Midtrans signature validation and status mapping
  (`src/tests/business-rules.test.ts`);
- public report and export privacy (`src/tests/business-rules.test.ts`);
- signed receipt URLs and expiry (`src/tests/telegram.test.ts`);
- admin/donor/guest authorization and Better Auth role scoping
  (`src/tests/business-rules.test.ts`).

Run a single file while debugging:

```bash
node --import tsx --test src/tests/security-hardening.test.ts
```

## Layer 3 — HTTP checks against a running instance

Start a local or staging instance, then verify the boundary behavior:

```bash
# Guest admin API must be rejected
curl -i http://localhost:3000/api/admin/expenses

# A cross-site admin mutation must be rejected when Origin is sent
curl -i -X POST http://localhost:3000/api/admin/expenses \
  -H "Origin: https://evil.example" \
  -H "Content-Type: application/json" \
  -d '{}'

# Donation creation is rate limited
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3000/api/donations \
    -H "Content-Type: application/json" \
    -d '{"amount":1000}'
done
```

Expected: guest admin requests return `401`, a foreign `Origin` returns `403`,
and the donation burst eventually returns `429` with a `Retry-After` header.

Also confirm cookies are `HttpOnly`, `Secure` in production, and `SameSite=Lax`,
and that the response includes the security headers from `next.config.ts`.

## Layer 4 — Dynamic scan and manual review

Run a baseline scan against staging only, never against production during a
campaign or donation event:

```bash
docker run -t ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t https://staging.example.com
```

Review the report manually; automated scanners produce false positives on
payment popups and third-party scripts.

Manual checklist before a public launch:

- Midtrans webhook: invalid signature does not change donation state.
- Duplicate webhook: replay does not increase income.
- Public report and exports: no donor email, phone, or private name.
- Anonymous and hidden donors render as `Anonim`.
- Only `settlement` counts as income.
- Admin routes and admin APIs reject guest and donor sessions.
- Receipt and distribution uploads reject mismatched file bytes.
- Backups restore successfully; secrets are rotated from placeholders.
- `/admin`, `/api/`, and draft content are not indexed.

## Known limitations

- The rate limiter is in-memory and protects a single container. Its bucket map
  is capped at 10,000 entries and evicts the oldest bucket so rotating
  identifiers cannot exhaust memory, but replace it with a shared store before
  running multiple app replicas.
- The proxy cannot verify Better Auth sessions because it has no database
  access, so requests carrying only a Better Auth cookie are passed to the admin
  layout and route handlers for the authoritative check.
- There is no Content-Security-Policy yet because Midtrans Snap injects its own
  scripts. Add a nonce-based policy only after a real payment smoke test.
- Automated tests prove regression safety, not the absence of vulnerabilities.
  A focused penetration test is still recommended before handling real money at
  scale.
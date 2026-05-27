# Better Auth Setup — Jumat Berkah

Phase 22 memakai Better Auth untuk Google OAuth dan email/password. Akses admin tetap ditentukan oleh role di tabel domain `users`, bukan keberhasilan login Google saja.

## Environment Variables

Local `.env.local`:

```env
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<random-local-secret>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
```

Production `.env.production`:

```env
BETTER_AUTH_URL=https://berkahkaryo.my.id
BETTER_AUTH_SECRET=<random-production-secret>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
```

Generate secret:

```bash
openssl rand -base64 32
```

Do not commit or paste secrets.

## Google OAuth Client

Application type:

```txt
Web application
```

Authorized JavaScript origins:

```txt
http://localhost:3000
https://berkahkaryo.my.id
```

Authorized redirect URIs:

```txt
http://localhost:3000/api/auth/callback/google
https://berkahkaryo.my.id/api/auth/callback/google
```

## Provision Admin Email/Password

Run this only with local/server env loaded and dev/production app reachable at `BETTER_AUTH_URL`.

Required temporary env values:

```env
BETTER_AUTH_ADMIN_EMAIL=<admin email>
BETTER_AUTH_ADMIN_NAME=<admin display name>
BETTER_AUTH_ADMIN_PASSWORD=<temporary admin password>
```

Command:

```bash
npm run seed:better-auth-admin
```

The script creates a Better Auth email/password account through `/api/auth/sign-up/email`, then upserts the domain `users` row with `role = admin`. Do not commit the temporary password.

## Access Rules

Admin flow:

```txt
Google/email-password login succeeds → app checks domain users.email → role must be admin → /admin allowed
```

Donor flow:

```txt
Google/email-password login succeeds → existing donor role allowed, missing user is created as donor, admin role is denied donor area
```

Legacy fallback remains temporarily available:

- Admin code login: `/api/auth/admin/login`
- Donor code login: `/api/auth/donor/login`

Remove fallback only after Better Auth login is validated in production and users are migrated.

## Database

Better Auth tables are separate from financial/domain tables:

```txt
auth_users
auth_sessions
auth_accounts
auth_verifications
```

Domain `users` remains source of truth for app role and admin/donor authorization.

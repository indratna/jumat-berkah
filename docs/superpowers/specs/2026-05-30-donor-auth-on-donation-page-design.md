# Donor Auth on Donation Page Design

Date: 2026-05-30
Status: Draft for user review

## Goal

Add optional donor login/signup entry points to `/donasi` without making login mandatory or slowing anonymous donations. Donor accounts should improve convenience, donation history, and engagement while preserving low-friction donation flow.

## Decisions

- Donation remains possible without login.
- `/donasi` gets a non-intrusive auth banner above the form.
- `/donasi/status/[orderId]` gets a post-payment signup CTA when a guest donation has an email.
- Signup supports Google and email/password.
- Email/password signup requires email verification before login.
- Signup from a status page pre-fills name and email from the donation.
- Donations only auto-link to a new account when signup uses the same email as the donation.
- Admin sessions must not be treated as donor sessions on `/donasi`.

## Existing Context

Existing routes:

- `/masuk` — donor login with Google and legacy login code.
- `/login` — admin login.
- `/akun/donasi` — donor donation history.
- `/akun/profil` — donor profile and password management.
- `/lupa-password` and `/reset-password` — Better Auth password reset.

Existing data model:

- Better Auth users live in `auth_users`.
- App-domain users live in `users`.
- Donations have nullable `donations.user_id` plus donor contact fields such as `donor_email` and `donor_name`.
- `/api/me/donations` reads donations by `userId`, so old guest donations must be attached to the app user before they appear in account history.

## User Experience

### `/donasi` anonymous banner

Show a small craft-style banner above the donation form:

```txt
Sudah punya akun?
Login agar nama dan email tidak perlu diisi ulang.
[Masuk] [Daftar]
```

Links:

- `Masuk` -> `/masuk?next=/donasi`
- `Daftar` -> `/daftar?next=/donasi`

The banner is not dismissible and must not block the form.

### `/donasi` logged-in donor banner

If the current user is a donor, show:

```txt
Selamat datang, [Nama]
Donasi ini akan masuk ke riwayat akun Anda.
[Lihat riwayat donasi] [Logout]
```

Links/actions:

- `Lihat riwayat donasi` -> `/akun/donasi`
- `Logout` signs out donor auth and redirects to `/donasi`.

Remove the older in-form `Masuk sebagai ...` block from `DonationForm` so auth state is handled by one banner.

### `/donasi` admin sessions

If a legacy admin cookie or Better Auth admin session exists:

- Do not render the donor auth banner.
- Do not prefill donor name/email from Better Auth donor lookup.
- Do not call `getBetterAuthDonorUser` when an admin session is detected.

This fixes the session hygiene issue where an admin with a personal donor Better Auth account sees donor copy on `/donasi`.

### `/daftar`

Create a donor signup page with craft styling:

- Title: `Daftar akun donatur`
- Value copy: donation history, no repeated identity entry, optional future reminders.
- Google signup button.
- Separator `atau`.
- Email/password form with fields:
  - name
  - email
  - password

Validation:

- Name: trim, required, max 80 characters.
- Email: valid email shape.
- Password: 8–128 characters, aligned with Better Auth config.

Query params:

- `email` pre-fills email.
- `name` pre-fills name.
- `next` defines destination intent, default `/akun/donasi`.

Email/password signup success redirects to `/cek-email?email=<email>&next=<next>`.

Google signup uses existing Better Auth social flow and redirects to `next` or `/akun/donasi`.

### `/cek-email`

Show verification instructions after email/password signup:

```txt
Cek email Anda
Kami sudah mengirim link verifikasi ke [email].
Klik link untuk mengaktifkan akun.
Tidak ada email? Cek folder spam, atau kirim ulang email verifikasi.
Sudah verifikasi? Masuk sekarang.
```

Actions:

- Resend verification email.
- Link to `/masuk?email=<email>`.

Mark page `noindex`.

### `/donasi/status/[orderId]` signup CTA

Show CTA only when:

- user is not logged in as donor; and
- donation has a non-empty `donorEmail`.

CTA copy:

```txt
Simpan donasi ini ke akun
Kami bisa hubungkan donasi ini ke akun Anda.
Daftar dengan email yang sama: [email].

Manfaat:
- Riwayat semua donasi tersimpan otomatis
- Tidak perlu isi nama dan email lagi
- Pengingat opsional saat program Jumat aktif

[Daftar dengan email ini]
Sudah punya akun? [Masuk]
```

Links:

- Signup: `/daftar?email=<encoded>&name=<encoded>&next=/akun/donasi`
- Login: `/masuk?email=<encoded>&next=/akun/donasi`

If donor signs up with a different email, the old donation is not linked automatically. This is accepted for MVP.

## Technical Design

### Donor banner resolver

Add a pure resolver, for example:

```ts
type DonorAuthBannerVariant = "anonymous" | "logged-in" | "hidden";

function resolveDonorAuthBannerVariant(input: {
  adminUser: { id: string } | null;
  donorUser: { id: string } | null;
}): DonorAuthBannerVariant {
  if (input.adminUser) return "hidden";
  if (input.donorUser) return "logged-in";
  return "anonymous";
}
```

Use this in `/donasi/page.tsx` after resolving admin first.

### Auth resolution order on `/donasi`

Use server-side checks in this order:

1. legacy admin session
2. Better Auth admin session
3. legacy donor session
4. Better Auth donor session only if no admin session exists

Pseudo-flow:

```txt
admin = legacyAdmin || betterAuthAdmin
legacyDonor = getDonorUser(donorCookie)
betterDonor = admin ? null : getBetterAuthDonorUser(headers)
donor = admin ? null : legacyDonor || betterDonor
```

### Better Auth email verification

Update `src/lib/better-auth.ts`:

- Set email/password signup to require email verification.
- Add email verification send callback.
- Use `safeSendEmail(buildEmailVerificationEmail(...))`.
- In non-production, log verification URL when send fails.

Preferred behavior:

- `sendOnSignUp: true`
- `autoSignInAfterVerification: true`
- expiry: 1 hour

### Email template

Add `buildEmailVerificationEmail({ email, url })` in `src/lib/email.ts`.

Template requirements:

- Indonesian copy.
- Subject: `Verifikasi email donatur Jumat Berkah Karyo`.
- HTML and text body.
- Button/link to verification URL.
- Mention link expiry.

### App-domain user creation

When Better Auth creates a user, ensure an app-domain `users` row exists.

Behavior:

- Upsert by email.
- Create role `donor` for new donor auth users.
- Do not downgrade an existing admin user to donor.
- If existing app user has role admin, do not attach donor donation history.

### Attach guest donations to donor account

Add `attachOrphanDonationsToUser` in `src/lib/donations.ts`:

```ts
async function attachOrphanDonationsToUser(input: {
  userId: string;
  email: string;
}) {
  // normalize email
  // update donations where donorEmail equals email and userId is null
  // return attached count
}
```

Rules:

- Only match normalized email.
- Only update `userId: null` donations.
- Do not change amount, status, privacy flags, or payment fields.
- Idempotent.
- Create audit log entry with action `donor_account_attached_donations` when count > 0.

When to call:

- For email/password signup: after email verification.
- For Google signup: after auth user creation if email is already verified.
- Optional deploy backfill: run once for existing donor app users after release.

### Status page CTA data

Status page already loads donation by order ID. Pass safe fields to CTA:

- `orderId`
- `donorEmail`
- `donorName`
- login state

Never expose phone number in CTA.

## Security and Privacy

- Login/signup remains optional.
- Public reports still hide private donor fields.
- Anonymous donor remains anonymous publicly even if donation later links to account.
- Admin sessions do not become donor prefill sessions.
- Email verification protects email/password signup from unverified account ownership.
- Donation linking by email happens only after email is verified or Google verified.
- Never expose donor phone in signup CTA.
- Do not alter payment status from auth flows.

## Testing Plan

### Unit tests

Add tests for:

- banner resolver:
  - anonymous -> anonymous
  - donor -> logged-in
  - admin -> hidden
  - admin plus donor -> hidden
- `buildEmailVerificationEmail`:
  - contains URL
  - Indonesian subject
  - has text and HTML body
- `attachOrphanDonationsToUser`:
  - links matching orphan donations
  - skips empty email
  - skips donations with different email
  - skips donations already linked
  - is idempotent

### Manual smoke

1. Anonymous opens `/donasi` -> sees login/signup banner.
2. Donor clicks `Daftar` -> `/daftar` opens.
3. Email/password signup -> redirects to `/cek-email`.
4. Verification email URL works in dev log or email provider.
5. After verify -> donor can access `/akun/donasi`.
6. Guest donation with email -> status page shows signup CTA.
7. Signup with same email -> donation appears in `/akun/donasi`.
8. Signup with different email -> donation does not auto-link.
9. Donor login -> `/donasi` shows welcome banner and history/logout actions.
10. Admin login -> `/donasi` hides donor banner and does not prefill donor fields.
11. Donation flow popup/redirect remains unchanged.

### Validation commands

```bash
npm run lint
npm test
npm run build
```

## Risks and Mitigations

### Existing unverified auth users

Enabling required email verification can lock out existing email/password users with `email_verified=false`.

Mitigation:

- Query `auth_users` before release.
- If any active email/password users are unverified, send verification email or mark verified after manual review.

### Email provider dependency

If Resend/email provider is not configured in production, email/password signup cannot complete.

Mitigation:

- Require email provider smoke before release.
- Keep Google signup available as fallback.
- In non-production, log verification URLs when email send fails.

### Accidental admin donor prefill

Admin might also have a donor record using personal email.

Mitigation:

- Resolve admin first and hide donor auth banner when admin session exists.
- Do not call Better Auth donor resolver for admin sessions.

### Existing donor accounts before hook

Existing Google donor accounts created before this feature may have orphan donations not linked.

Mitigation:

- Add one-shot backfill script or admin maintenance command to attach orphan donations to existing donor users by verified email.

## Out of Scope

- Making login mandatory before donating.
- Native mobile app.
- Recurring auto donation.
- Complex donor onboarding wizard.
- Claiming donations by order ID when signup email differs.
- Email marketing workflows beyond verification.
- Changing Midtrans payment or webhook rules.

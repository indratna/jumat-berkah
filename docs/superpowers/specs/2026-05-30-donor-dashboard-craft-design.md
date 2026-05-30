# Donor Dashboard Craft Redesign Design

Date: 2026-05-30
Status: Approved design

## Goal

Turn `/akun/donasi` from a simple donation-history table into a complete, personal donor dashboard with the same craft visual language as `/donasi`, `/masuk`, and `/daftar`.

The dashboard should feel like a warm donor home: personal, reassuring, useful, and still low-friction for repeat donations.

## Tone

Use warm religious copy with light impact framing.

Primary hero direction:

```txt
Assalamu’alaikum, {nama}
Terima kasih sudah ikut menjaga Jumat Berkah tetap berjalan.
```

Supporting copy:

```txt
Di sini Anda bisa melihat riwayat donasi, status pembayaran, dan pengaturan akun donatur.
```

## Scope

In scope:

- Redesign `/akun/donasi` as donor dashboard.
- Use craft styling: `landing-craft`, `landing-noise`, `craft-card`, `craft-card-strong`, `craft-pill`, `craft-num`.
- Keep donor-only server auth guard.
- Show personal donor summary.
- Show current Friday target progress using public aggregate data only.
- Show Telegram account linking/reminder status.
- Show profile summary and edit profile link.
- Replace donation history table with mobile-first donation cards/list.
- Keep links to donation status pages.
- Keep `Donasi Lagi` CTA.

Out of scope:

- New database schema.
- Payment, Midtrans, webhook, or financial status changes.
- Admin dashboard changes.
- WhatsApp account-level preferences.
- Distribution story/impact story cards in this pass.
- Recurring donation or auto donation.

## User Experience

### Header

Top area mirrors public craft pages:

- Brand link: `JB Jumat Berkah Karyo`.
- Primary action: `Donasi Lagi`.
- Secondary action: `Profil`.
- Logout action.

### Hero

Hero greets donor by name if available, otherwise by email-safe fallback.

Content:

- `Assalamu’alaikum, {nama}`.
- Warm thank-you copy.
- CTA: `Donasi Lagi Jumat Ini` -> `/donasi`.
- Secondary link: `Lihat laporan publik` -> `/laporan?period=jumat`.

### KPI Bento

Show personal account metrics:

- Total donasi berhasil: sum of `settlement` donations only.
- Jumlah transaksi: all linked donations.
- Donasi pending: count `pending` donations.
- Donasi terakhir: latest donation amount/status/date or empty fallback.

Pending and failed donations are visible but do not count toward successful total.

### Target Jumat berjalan

Show public current Friday target progress:

- Target amount.
- Terkumpul.
- Progress percentage.
- Sisa target.

Rules:

- Use only public aggregate target/report data.
- Do not expose other donor identities.
- If no target exists, show `Target Jumat belum diatur.`

### Telegram donor card

Use existing donor Telegram fields:

- If linked: show `Telegram sudah terhubung` and reminder status `aktif`/`nonaktif`.
- If not linked: show command `/mulai <kode>`.
- Keep existing behavior of creating `telegramLinkCode` when missing.

No WhatsApp status is shown because WhatsApp consent is donation-level today, not account-level.

### Profile summary

Show:

- Name.
- Email.
- Link to `/akun/profil`.

Email is shown only to the logged-in donor on their own dashboard.

### Donation history cards

Replace the desktop table with card/list history.

Each card shows:

- Order ID.
- Amount.
- Human status label:
  - `Berhasil` for `settlement`.
  - `Menunggu` for `pending`.
  - `Gagal` for `cancel`, `deny`, `failure`.
  - `Kedaluwarsa` for `expire`.
  - `Refund` for `refund`.
- Privacy label:
  - `Anonim`.
  - `Nama tampil publik`.
  - `Nama disamarkan`.
- Date.
- Optional message/doa when present.
- Link: `Lihat status` -> `/donasi/status/[orderId]`.

Show up to 10 latest donations in this pass.

### Empty state

When no linked donations exist:

```txt
Belum ada donasi yang terhubung.
Mulai dari donasi pertama Anda, atau daftar dengan email yang sama agar riwayat lama bisa tersambung.
```

CTA: `Donasi Pertama` -> `/donasi`.

## Data Flow

1. Server resolves donor session from legacy donor cookie or Better Auth donor session.
2. If no donor exists, redirect to `/masuk`.
3. Server fetches donor Telegram fields and ensures `telegramLinkCode` exists.
4. Server fetches latest linked donations by `userId = donor.id`.
5. Server calculates personal metrics from fetched donations.
6. Server fetches current Friday target/progress using existing weekly target/report helpers if available.
7. Server renders craft dashboard.

## Privacy and Security

- Route remains donor-auth guarded server-side.
- Donations query must filter by `userId = donor.id`.
- Public target card must use aggregates only.
- Do not expose donor phone.
- Do not expose other donor email/name.
- Do not change payment status mapping.
- Do not count pending/failed donations in successful totals.

## Error, Empty, and Fallback States

- Unauthenticated donor redirects to `/masuk`.
- No donations: show empty state card.
- No weekly target: show target fallback card.
- Missing donor name: use email or generic `Donatur` fallback.
- Telegram not linked: show setup command.

## Testing and Validation

Automated validation:

```txt
npm run lint
npm test
npm run build
```

Recommended code tests:

- Add pure helper tests if summary/status helper is extracted.
- Preserve existing tests for donation financial rules and donor auth guards.

Manual smoke:

- Donor logged in opens `/akun/donasi` dashboard.
- Anonymous visitor redirects to `/masuk`.
- Donor with history sees metrics and donation cards.
- Donor without history sees empty state.
- Telegram unlinked card shows `/mulai <kode>`.
- Target card shows progress or fallback.
- `Donasi Lagi`, `Profil`, `Lihat status`, and logout actions work.

## Acceptance Criteria

- `/akun/donasi` visually matches craft public/donor auth pages.
- Dashboard greets donor personally.
- Dashboard shows personal successful total, transaction count, pending count, and latest donation.
- Dashboard shows current Friday target progress or clear fallback.
- Dashboard shows Telegram link/reminder status.
- Dashboard shows donor profile summary.
- Donation history uses cards/list, not table.
- No payment, webhook, financial status, or public privacy rules change.
- Automated validation passes.

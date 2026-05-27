# Technical Specification — Jumat Berkah

## 1. Purpose

Dokumen ini adalah source of truth teknis untuk aplikasi Jumat Berkah. Gunakan bersama `PRD.md`, `IMPLEMENTATION_PLAN.md`, dan `AGENTS.md`.

Jika ada konflik:

1. `AGENTS.md` menang untuk aturan kerja AI dan standar repo.
2. `TECHNICAL_SPEC.md` menang untuk implementasi teknis.
3. `PRD.md` menang untuk perilaku produk dan scope.
4. `IMPLEMENTATION_PLAN.md` menang untuk urutan eksekusi.

## 2. Product Summary

Aplikasi web donasi publik untuk program Jumat Berkah. Donatur dapat berdonasi via QRIS Midtrans tanpa wajib login. Admin mengelola donasi, pengeluaran, dan laporan. Publik dapat melihat laporan pemasukan, pengeluaran, dan saldo secara transparan.

## 3. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js App Router | Full-stack web app |
| Language | TypeScript | Strict typing required |
| Styling | Tailwind CSS | Utility-first styling |
| Database | PostgreSQL | Transactional data and reports |
| ORM | Prisma or Drizzle | Prefer type-safe migrations and queries |
| Auth | Auth.js/NextAuth or equivalent | Admin required, donor optional |
| Payment | Midtrans Snap/Core API | QRIS payment |
| Hosting | Vercel/Railway/Fly.io | Final choice can be decided during deploy |
| Storage | S3-compatible/R2 optional | For expense receipts later |
| Notifications & Bot | Telegram Bot API | Server-only token, optional via env vars |

## 4. Architecture Principles

- Server owns all trusted business logic.
- Client never receives Midtrans server key.
- Client never decides final payment status.
- Webhook must verify Midtrans signature before changing donation status.
- Donation report only counts successful payments.
- Public report must never expose private donor email or phone.
- Admin-only operations must be checked on server.
- Changes to financial records must be auditable.
- Telegram bot token and webhook secret are server-only and never sent to client.
- Telegram webhook must verify the secret token from `X-Telegram-Bot-Api-Secret-Token` before any state change.
- Telegram admin write actions must be gated by an env-driven chat ID allowlist enforced server-side.
- Telegram notifications are fire-and-forget: a Telegram outage must not fail Midtrans webhook processing.
- Outbound notifications must follow public donor display rules (no email/phone, `Anonim` when anonymous or hidden).

## 5. Route Structure

Recommended initial routes:

```txt
/
/donasi
/donasi/status/[orderId]
/laporan
/login
/akun/donasi
/admin
/admin/donasi
/admin/pengeluaran
```

Recommended API routes:

```txt
/api/donations
/api/donations/[orderId]
/api/webhooks/midtrans
/api/webhooks/telegram
/api/reports/public
/api/me/donations
/api/admin/donations
/api/admin/expenses
/api/admin/expenses/[id]
/api/admin/reports/export
```

## 6. Database Model

Use UUID primary keys unless ORM/project convention chooses different safe default.

### 6.1 Users

Stores authenticated admins and optional donor accounts.

Fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | yes | Primary key |
| name | string | no | User display name |
| email | string | yes | Unique |
| role | enum | yes | `donor`, `admin` |
| created_at | timestamp | yes | Created time |
| updated_at | timestamp | yes | Updated time |

Indexes:

- Unique index on `email`.
- Index on `role` if needed.

### 6.2 Donations

Stores donation payment records.

Fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | yes | Primary key |
| order_id | string | yes | Unique Midtrans order id |
| user_id | UUID | no | Donor account if logged in |
| donor_name | string | no | Submitted name |
| donor_email | string | no | Private |
| donor_phone | string | no | Private |
| is_anonymous | boolean | yes | Defaults false |
| show_name_publicly | boolean | yes | Defaults true unless anonymous |
| amount | integer | yes | Rupiah amount |
| message | text | no | Optional doa/message |
| payment_provider | string | yes | `midtrans` |
| payment_method | string | yes | `qris` |
| status | enum | yes | See status enum |
| midtrans_transaction_id | string | no | From Midtrans |
| paid_at | timestamp | no | Set on success |
| created_at | timestamp | yes | Created time |
| updated_at | timestamp | yes | Updated time |

Status enum:

```txt
pending
settlement
expire
cancel
deny
failure
refund
```

Indexes:

- Unique index on `order_id`.
- Index on `status`.
- Index on `created_at`.
- Index on `paid_at`.
- Index on `user_id`.

### 6.3 Expenses

Stores program expenses.

Fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | yes | Primary key |
| expense_date | date | yes | Expense date |
| category | string | yes | Category |
| description | text | yes | Expense description |
| amount | integer | yes | Rupiah amount |
| vendor_name | string | no | Optional vendor/person |
| receipt_url | string | no | Optional receipt file |
| created_by | UUID | yes | Admin user id |
| created_at | timestamp | yes | Created time |
| updated_at | timestamp | yes | Updated time |

Indexes:

- Index on `expense_date`.
- Index on `category`.
- Index on `created_by`.

### 6.4 Midtrans Webhook Logs

Stores raw webhook payloads for audit and debugging.

Fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | yes | Primary key |
| order_id | string | yes | Midtrans order id |
| transaction_status | string | yes | Raw Midtrans status |
| fraud_status | string | no | Raw fraud status |
| signature_valid | boolean | yes | Verification result |
| raw_payload | jsonb | yes | Full payload |
| received_at | timestamp | yes | Received time |

Indexes:

- Index on `order_id`.
- Index on `received_at`.

### 6.5 Audit Logs

Stores important application changes.

Fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| id | UUID | yes | Primary key |
| actor_user_id | UUID | no | Admin/user actor |
| action | string | yes | Action name |
| entity_type | string | yes | `donation`, `expense`, etc. |
| entity_id | string | yes | Entity id |
| before | jsonb | no | Previous data |
| after | jsonb | no | New data |
| created_at | timestamp | yes | Created time |

Indexes:

- Index on `actor_user_id`.
- Index on `entity_type`, `entity_id`.
- Index on `created_at`.

## 7. Business Rules

### 7.1 Donation Rules

- Donation can be created without login.
- Logged-in donor donation should link to `user_id`.
- Minimum donation defaults to Rp1.000 unless changed by config.
- Amount must be positive integer in Rupiah.
- Initial donation status is `pending`.
- Only `settlement` donation counts as income.
- `capture` from Midtrans can map to internal `settlement` when valid.
- `pending`, `expire`, `cancel`, `deny`, `failure` do not count as income.
- `refund` must not count as active income.

### 7.2 Privacy Rules

- Public report must never show donor email.
- Public report must never show donor phone.
- If `is_anonymous = true`, public name must be `Anonim`.
- If `show_name_publicly = false`, public name must be hidden or shown as `Anonim`.
- Admin may see donor contact data if needed for operations.

### 7.3 Report Rules

- Income = sum of successful donations in selected period.
- Expenses = sum of expenses in selected period.
- Balance = total successful donations all time - total expenses all time, unless UI explicitly shows period balance.
- Public report must be accessible without login.
- Report list should support pagination or safe limits.

### 7.4 Expense Rules

- Expense amount must be positive integer.
- Expense date is required.
- Expense category is required.
- Expense create/update/delete requires admin role.
- Every expense create/update/delete must create audit log.
- Expenses immediately affect public report after saved.

### 7.5 Webhook Rules

- Webhook must verify Midtrans signature key before trusted update.
- Invalid signature must not update donation status.
- Raw webhook payload should be stored even when signature invalid, marked `signature_valid = false`.
- Webhook handling must be idempotent.
- Duplicate successful webhook must not double count income.
- Payment status should only move according to safe state transitions.

### 7.6 Telegram Rules

- All Telegram features are opt-in. When `TELEGRAM_BOT_TOKEN` is empty, no Telegram code path may run.
- Telegram webhook must verify the secret token via the `X-Telegram-Bot-Api-Secret-Token` header before any side effect.
- Telegram write commands must check the sender chat ID against `TELEGRAM_ADMIN_CHAT_IDS` before reaching business logic.
- Telegram read commands must also check the sender chat ID against `TELEGRAM_ADMIN_CHAT_IDS` before returning admin operational data.
- Telegram-created/updated/deleted expenses must reuse expense validators where applicable and write audit logs with `actor_user_id = null` plus `channel: telegram` metadata.
- Telegram edit/delete commands must require inline confirmation from the same chat and Telegram user that initiated the command.
- Settlement notification fires once per donation status transition: only when `statusChanged === true` and the new internal status is `settlement`.
- Settlement notification must omit donor email and phone, and must apply public donor display rules (`Anonim` for anonymous or hidden donors).
- Telegram send failures must be caught so they cannot fail the Midtrans webhook response or block donation state updates.
- Settlement notifications require `TELEGRAM_NOTIFY_ENABLED=true`, a non-empty `TELEGRAM_BOT_TOKEN`, and a numeric `TELEGRAM_NOTIFY_CHAT_ID`. Otherwise the notification is silently skipped.

## 8. API Contracts

### 8.1 Create Donation

`POST /api/donations`

Auth: optional.

Request:

```json
{
  "donorName": "Budi",
  "donorEmail": "budi@example.com",
  "donorPhone": "08123456789",
  "isAnonymous": false,
  "showNamePublicly": true,
  "amount": 50000,
  "message": "Semoga berkah"
}
```

Success response:

```json
{
  "orderId": "JB-20260520-000001",
  "status": "pending",
  "payment": {
    "provider": "midtrans",
    "method": "qris",
    "snapToken": "token-or-null",
    "redirectUrl": "https://app.sandbox.midtrans.com/..."
  }
}
```

Validation errors:

- Amount missing or below minimum.
- Invalid email format.
- Invalid phone format if validation implemented.

### 8.2 Get Donation Status

`GET /api/donations/[orderId]`

Auth: public-safe.

Response:

```json
{
  "orderId": "JB-20260520-000001",
  "amount": 50000,
  "status": "settlement",
  "paidAt": "2026-05-20T10:00:00.000Z"
}
```

Do not expose private donor contact data.

### 8.3 Midtrans Webhook

`POST /api/webhooks/midtrans`

Auth: signature verification.

Expected payload: Midtrans notification payload.

Must:

- Validate signature.
- Store webhook log.
- Match donation by `order_id`.
- Update donation status safely.
- Return 200 for processed valid notifications.

### 8.4 Public Report

`GET /api/reports/public?from=YYYY-MM-DD&to=YYYY-MM-DD`

Auth: public.

Response:

```json
{
  "summary": {
    "income": 1000000,
    "expenses": 750000,
    "balance": 250000
  },
  "donations": [
    {
      "date": "2026-05-20",
      "donorName": "Anonim",
      "amount": 50000,
      "message": "Semoga berkah"
    }
  ],
  "expenses": [
    {
      "date": "2026-05-20",
      "category": "Bahan makanan",
      "description": "Beras dan lauk",
      "amount": 300000
    }
  ]
}
```

### 8.5 Admin Expenses

`POST /api/admin/expenses`

Auth: admin only.

Request:

```json
{
  "expenseDate": "2026-05-20",
  "category": "Bahan makanan",
  "description": "Beras dan lauk",
  "amount": 300000,
  "vendorName": "Pasar",
  "receiptUrl": null
}
```

Success response:

```json
{
  "id": "expense-id",
  "expenseDate": "2026-05-20",
  "category": "Bahan makanan",
  "description": "Beras dan lauk",
  "amount": 300000
}
```

### 8.6 Telegram Webhook

`POST /api/webhooks/telegram`

Auth: Telegram secret token via header `X-Telegram-Bot-Api-Secret-Token` plus admin chat ID allowlist for write commands.

Expected payload: standard Telegram Bot API `Update` object.

Must:

- Reject any request whose `X-Telegram-Bot-Api-Secret-Token` does not match `TELEGRAM_WEBHOOK_SECRET`.
- Reject write commands from chat IDs that are not in `TELEGRAM_ADMIN_CHAT_IDS`.
- Parse the `/pengeluaran` command and reuse `validateExpenseInput` for validation.
- Persist the expense and create an audit log with `channel: telegram` marker.
- Reply with a Telegram message that confirms success or explains the validation error.
- Return 200 for successfully handled updates so Telegram does not retry.

Expense command format:

```txt
/pengeluaran YYYY-MM-DD | Kategori | Nominal | Deskripsi | Vendor (opsional)
```

The parser accepts id-ID thousand separators (`300.000`), rejects fractional amounts, and recognises both `/pengeluaran` and `/pengeluaran@BotName` forms.

Read-only admin commands supported in Phase 12:

| Command | Function |
|---|---|
| `/saldo` | Current all-time balance, total income/expenses, today income, week income |
| `/donasi_terbaru [n]` | Latest settlement donations, default 5, max 20, public-safe donor names |
| `/pengeluaran_terbaru [n]` | Latest expenses, default 5, max 20 |
| `/cari <orderId>` | Public-safe donation status/detail by order ID |
| `/laporan <hari|minggu|bulan>` | Public report summary for selected period |
| `/csv [from] [to]` | Send admin report CSV as Telegram document |
| `/edit_pengeluaran <id> field=value ...` | Start confirmed expense edit flow with field allowlist |
| `/hapus_pengeluaran <id>` | Start confirmed expense delete flow |

## 9. Midtrans Integration

### 9.1 Environment Variables

Required:

```txt
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_MERCHANT_ID=
NEXT_PUBLIC_APP_URL=
```

Never expose `MIDTRANS_SERVER_KEY` to client.

### 9.2 Payment Flow

1. User submits donation form.
2. Server validates input.
3. Server creates donation with `pending` status.
4. Server creates Midtrans transaction using unique `order_id`.
5. Server returns payment URL/token to client.
6. User pays via QRIS.
7. Midtrans sends webhook.
8. Server validates signature.
9. Server updates donation status.
10. Public report reflects successful donation.

### 9.3 Signature Verification

Verify using Midtrans formula for notification signature:

```txt
SHA512(order_id + status_code + gross_amount + server_key)
```

Compare with `signature_key` from payload using safe comparison where possible.

### 9.4 Status Mapping

| Midtrans Status | Fraud Status | Internal Status | Counts as Income |
|---|---|---|---|
| pending | any | pending | no |
| settlement | any | settlement | yes |
| capture | accept | settlement | yes |
| capture | challenge | pending | no |
| expire | any | expire | no |
| cancel | any | cancel | no |
| deny | any | deny | no |
| failure | any | failure | no |
| refund | any | refund | no |

## 9A. Telegram Integration

### 9A.1 Environment Variables

All variables are optional. The bot stays disabled when these are empty.

```txt
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_ADMIN_CHAT_IDS=
TELEGRAM_NOTIFY_CHAT_ID=
TELEGRAM_NOTIFY_ENABLED=false
TELEGRAM_PUBLIC_CHANNEL_ID=
TELEGRAM_FAILED_LOGIN_ALERT_THRESHOLD=5
TELEGRAM_FAILED_LOGIN_ALERT_WINDOW_MINUTES=15
TELEGRAM_ALERT_COOLDOWN_MINUTES=30
TELEGRAM_LARGE_EXPENSE_ALERT_THRESHOLD_RUPIAH=500000
```

Never expose `TELEGRAM_BOT_TOKEN` or `TELEGRAM_WEBHOOK_SECRET` to the client.

### 9A.2 Inbound Command Flow

1. Telegram delivers an `Update` to `POST /api/webhooks/telegram`.
2. Server reads `X-Telegram-Bot-Api-Secret-Token` and rejects with 401 if it does not match `TELEGRAM_WEBHOOK_SECRET`.
3. Server parses the update and the command token (handles `/pengeluaran@BotName`).
4. Server checks `chat.id` against `TELEGRAM_ADMIN_CHAT_IDS`. Unauthorised chats receive a denial reply and the request is recorded as rejected.
5. For `/pengeluaran`, the parser produces a `ParsedExpenseCommand` and `validateExpenseInput` runs.
6. On success, the server creates an `Expense` row and an audit log with `actor_user_id = null` and `channel: telegram` plus `telegramChatId` and `telegramUserId` in the audit `after` payload.
7. The server replies with a confirmation Telegram message that includes the new expense ID.

### 9A.2a Read-only Admin Command Flow

1. Telegram delivers an `Update` to `POST /api/webhooks/telegram`.
2. Server verifies the Telegram secret token.
3. Server checks `chat.id` against `TELEGRAM_ADMIN_CHAT_IDS`.
4. Server routes `/saldo`, `/donasi_terbaru`, `/pengeluaran_terbaru`, `/cari`, `/laporan`, or `/csv` to read-only handlers.
5. Calculations reuse `src/lib/reports.ts` or existing admin export logic where practical.
6. Donation names use public donor display rules, so hidden/anonymous donors show as `Anonim`.
7. CSV export is sent through Telegram `sendDocument` as a text/csv file.

### 9A.2b Confirmed Write Command Flow

1. Telegram delivers `/edit_pengeluaran` or `/hapus_pengeluaran` to `POST /api/webhooks/telegram`.
2. Server verifies Telegram secret token and checks admin chat allowlist.
3. `/edit_pengeluaran` accepts only allowlisted fields: `tanggal`, `kategori`, `nominal`, `deskripsi`, `vendor`, `struk` (also English/internal aliases).
4. Server validates the merged expense payload before creating a pending confirmation.
5. Server stores a short-lived pending action (in-memory or DB-backed) with chat ID, Telegram user ID, expense ID, and expiry.
6. Server sends inline keyboard buttons (`Ya`, `Batal`).
7. Callback query must come from the same chat ID and same Telegram user ID that initiated the action.
8. Confirmed edit updates the expense and writes an `expense.updated` audit log with before/after plus `channel: telegram` metadata.
9. Confirmed delete deletes the expense and writes an `expense.deleted` audit log with before plus `channel: telegram` metadata.
10. Expired or unauthorized confirmations must not mutate expense data.

### 9A.2c Public Transparency & Broadcast Flow

1. Public commands `/saldo_publik`, `/pengeluaran_publik [n]`, and `/laporan_publik <hari|minggu|bulan>` work from any chat after Telegram secret verification.
2. Public commands do not require `TELEGRAM_ADMIN_CHAT_IDS` membership.
3. Public commands are rate-limited per chat ID to reduce spam and cost.
4. Public outputs must never include donor email, donor phone, internal expense IDs, raw donor user IDs, or admin-only operational data.
5. `/broadcast_laporan` requires an allowlisted admin chat and sends the weekly public report summary to `TELEGRAM_PUBLIC_CHANNEL_ID`.
6. `TELEGRAM_PUBLIC_CHANNEL_ID` must be a numeric Telegram channel/chat ID, and the bot must have permission to post there.

### 9A.2d Operational & Security Alert Flow

1. Failed admin login attempts write `admin.login.failed` audit logs.
2. When failed login count reaches `TELEGRAM_FAILED_LOGIN_ALERT_THRESHOLD` inside `TELEGRAM_FAILED_LOGIN_ALERT_WINDOW_MINUTES`, Telegram sends one alert to `TELEGRAM_NOTIFY_CHAT_ID`.
3. Expense delete always sends a critical audit alert after the database transaction commits.
4. Expense create sends a critical audit alert when amount is at or above `TELEGRAM_LARGE_EXPENSE_ALERT_THRESHOLD_RUPIAH`.
5. `GET /api/cron/telegram/health` is protected by `X-Cron-Secret` or Vercel Cron `Authorization: Bearer $CRON_SECRET`; it checks database connectivity and required env values.
6. All operational/security alerts respect `TELEGRAM_ALERT_COOLDOWN_MINUTES` to avoid spam.

### 9A.3 Outbound Settlement Notification Flow

1. Midtrans webhook validates signature and updates donation state inside a database transaction.
2. After the transaction commits, the route inspects the result.
3. If `statusChanged === true` and the new status is `settlement`, the server calls `safeSendTelegramMessage` with a privacy-safe message.
4. Send errors are logged and swallowed; webhook response remains 200 to avoid Midtrans retries that could double notify.
5. Notification is silently skipped when `TELEGRAM_NOTIFY_ENABLED !== "true"`, `TELEGRAM_BOT_TOKEN` is empty, or `TELEGRAM_NOTIFY_CHAT_ID` is missing/invalid.

### 9A.4 Notification Privacy Mapping

| Donor State | Public Display in Notification |
|---|---|
| `is_anonymous = true` | `Anonim` |
| `show_name_publicly = false` | `Anonim` |
| `donor_name = null` | `Anonim` |
| Otherwise | `donor_name` as submitted |

Notifications never include `donor_email` or `donor_phone`.

### 9A.5 Audit Log Markers

Telegram-driven writes use the existing `audit_logs` table with these conventions:

- `actor_user_id`: `null` (Telegram updates do not authenticate as a Users row).
- `entity_type`: `expense`.
- `action`: `expense.created` (Phase 11). Future write commands will add `expense.updated` and `expense.deleted`.
- `after`: standard expense JSON plus `channel: "telegram"`, `telegramChatId`, and `telegramUserId`.

## 10. Auth and Authorization

### 10.1 Public Access

Allowed without login:

- Landing page.
- Donation form.
- Create donation.
- Donation status public-safe view.
- Public report.

### 10.2 Donor Access

Allowed after optional login:

- Personal donation history.
- Profile basics.

### 10.3 Admin Access

Requires admin role:

- Admin dashboard.
- View all donations.
- Manage expenses.
- Export reports.
- View audit logs if implemented.

### 10.4 Telegram Admin Chat Access

Granted to chat IDs listed in `TELEGRAM_ADMIN_CHAT_IDS`:

- Run `/pengeluaran` to create expenses.
- Run read-only operational commands: `/saldo`, `/donasi_terbaru`, `/pengeluaran_terbaru`, `/cari`, `/laporan`, and `/csv`.
- Run confirmed write commands: `/edit_pengeluaran` and `/hapus_pengeluaran`.
- Run `/broadcast_laporan` to send a weekly public summary to `TELEGRAM_PUBLIC_CHANNEL_ID`.
- Receive donation settlement notifications when their chat ID is set as `TELEGRAM_NOTIFY_CHAT_ID`.

Does not imply browser-side admin access. The Users table session cookie remains the only path into `/admin/*`.

## 11. UI Requirements

### 11.1 Public UI

- Mobile-first.
- Clear donation CTA.
- Donation flow must feel short.
- Use friendly Indonesian copy.
- Show clear status after payment.

### 11.2 Admin UI

- Prioritize clarity over decoration.
- Tables need filters and readable status badges.
- Financial numbers must use Rupiah formatting.
- Destructive actions require confirmation.

### 11.3 States

Every main page should handle:

- Loading state.
- Empty state.
- Error state.
- Success state where relevant.

## 12. Validation and Testing

Minimum validation before phase completion:

- Lint passes.
- Typecheck passes.
- Related tests pass when tests exist.
- Manual flow tested for changed feature.

Recommended test cases:

- Create donation rejects invalid amount.
- Create donation stores pending donation.
- Webhook rejects invalid signature.
- Webhook updates valid settlement to success.
- Duplicate webhook does not double count.
- Public report hides private donor data.
- Expense create requires admin.
- Expense affects report balance.
- Telegram webhook rejects requests with missing or wrong `X-Telegram-Bot-Api-Secret-Token`.
- Telegram write commands rejected when chat ID not in `TELEGRAM_ADMIN_CHAT_IDS`.
- `/pengeluaran` parser accepts well-formed input and id-ID thousand separators.
- `/pengeluaran` parser rejects fractional amounts, unknown categories, and missing fields.
- Settlement notification formatter applies public donor rules and excludes email/phone.
- Public Telegram commands parse only public-safe commands and remain separate from admin read commands.
- Public Telegram command rate limiter blocks excess requests in the configured window.
- Telegram public channel ID parser accepts only integer chat/channel IDs.
- Failed admin login alert decision respects threshold/window and cooldown.
- Critical audit alert decision covers expense delete and large expense create.
- Health alert endpoint remains protected by cron secret via `X-Cron-Secret` or Vercel Cron bearer auth.
- Settlement notification fires only on `statusChanged === true` to `settlement`.

## 13. Deployment Notes

Minimum production checklist:

- Production Midtrans keys configured.
- Webhook URL registered in Midtrans dashboard.
- Database migrations applied.
- Admin account created securely.
- Environment variables configured.
- Public report tested.
- QRIS payment tested in production with small amount if allowed.
- (If Telegram features enabled) `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ADMIN_CHAT_IDS`, `TELEGRAM_NOTIFY_CHAT_ID`, `TELEGRAM_NOTIFY_ENABLED`, and Telegram alert env values configured on host.
- (If Telegram features enabled) `setWebhook` registered with Telegram pointing at the public `/api/webhooks/telegram` URL with the secret token.
- (If using Cloudflare in front of webhooks) Bot Fight Mode and JS challenge disabled for `/api/webhooks/*`.

## 14. Non-Goals for MVP

- Native mobile app.
- Payroll deduction.
- Recurring auto donation.
- Multi-branch support.
- Inventory management.
- Complex accounting system.

## 15. v1.1+ Technical Addendum

Bagian ini mendefinisikan arah teknis untuk fitur produksi setelah MVP live. Detail final tetap dikerjakan per fase di `IMPLEMENTATION_PLAN.md`.

### 15.1 Backup & Restore Automation

Runtime target:

- Source DB container: `jumat-berkah-postgres`.
- Database: `jumat_berkah`.
- User: `jumat_berkah_user`.
- Backup format: compressed SQL dump (`.sql.gz`) unless later changed to custom `pg_dump -Fc`.
- Backup directory: server-local path outside Docker volume, e.g. `/var/backups/jumat-berkah`.

Technical rules:

- Backup script must only read from `jumat-berkah-postgres`.
- Restore drill must target a temporary database/container, never overwrite production without explicit manual confirmation.
- Retention cleanup must only delete files matching expected backup naming pattern inside configured backup directory.
- Backup logs must not include database password.

### 15.2 Better Auth Architecture

Preferred auth library: Better Auth.

Planned route:

```txt
/api/auth/[...all]
```

Planned auth capabilities:

- Google OAuth for admin and donor users.
- Email/password login.
- Password reset/change password.
- Session management via Better Auth.
- Profile image from OAuth provider.

Environment variables:

```env
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://berkahkaryo.my.id
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Security rules:

- Google OAuth success does not imply admin access.
- Admin authorization must check a server-side role/allowlist.
- Donor authorization must limit access to donor-owned records only.
- Password reset tokens must be time-limited and single-use.
- Password/session tables must not be exposed to client components.
- Existing login-code flow must be either migrated with fallback or explicitly removed after validation.

Data model direction:

- Better Auth may create/use auth tables such as user/session/account/verification.
- Existing domain models (`donations`, `expenses`, audit logs) remain source of truth for financial data.
- Any bridge between Better Auth user and app user must preserve existing role and privacy rules.

### 15.3 Email Notification Architecture

Provider: TBD per phase (SMTP, Resend, SendGrid, or another transactional provider).

Planned environment variables:

```env
EMAIL_PROVIDER=
EMAIL_FROM=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
ADMIN_EMAIL_NOTIFICATIONS=
```

Technical rules:

- Email sending must be server-only.
- Email failure must not fail Midtrans webhook processing.
- Auth email templates must avoid email enumeration leaks.
- Admin notification routing must be configured server-side.
- Public emails/exports must never include donor private fields unless sent directly to the donor/admin with appropriate purpose.

Initial email events:

- Password reset / email verification.
- Donation `settlement` admin notification.
- Large expense / delete expense admin alert.
- Repeated failed admin login alert.
- Invalid Midtrans signature alert.
- Backup failure alert.

### 15.4 Friday Reporting Cycle

Timezone:

```txt
Asia/Jakarta
```

Cycle rule:

```txt
Friday 00:00:00 → Thursday 23:59:59 Asia/Jakarta
```

Technical rules:

- Friday-cycle calculation must be centralized in a server utility.
- Report totals must reuse the same central report calculation used by public/admin reports.
- Only `settlement` donations count as income.
- Scheduler endpoint must be protected by `CRON_SECRET` or equivalent server-side auth.
- Telegram auto-post must write audit/log entry for success/failure.

### 15.5 Weekly Donation Target

Potential model:

```txt
weekly_targets
- id uuid
- cycle_start date
- cycle_end date
- target_amount integer
- note text nullable
- created_by uuid
- created_at timestamp
- updated_at timestamp
```

Rules:

- Money stored as integer Rupiah.
- Progress = settlement donations in cycle / target amount.
- Public progress must not expose donor private fields.
- Low-progress reminders must avoid spam with cooldown/rate-limit.

### 15.6 Distribution Story & Photo Report

Potential model:

```txt
distribution_reports
- id uuid
- cycle_start date
- title text
- summary text
- package_count integer nullable
- location_summary text nullable
- photo_urls jsonb
- published_at timestamp nullable
- created_by uuid
- created_at timestamp
- updated_at timestamp
```

Privacy rules:

- Avoid showing identifiable vulnerable recipients unless consent exists.
- Donor email/phone must never appear in public story.
- Admin should see copy guidance before publishing photos.

### 15.7 Public Transparency Enhancements

Public timeline sources:

- Donations with status `settlement`.
- Expenses safe for public report.
- Published distribution reports.

Rules:

- Timeline must use public-safe donor display (`Anonim` when anonymous or hidden).
- No internal IDs, email, phone, raw Telegram chat IDs, or admin-only contact data.
- Expense category chart must reuse centralized report/category summary logic.

### 15.8 Admin Audit & Approval UI

Routes (planned):

```txt
/admin/audit
/admin/persetujuan
```

Rules:

- Admin-only server-side auth check required.
- Audit logs are read-only.
- Expense approval UI must reflect existing approval/audit logic; do not duplicate approval business rules in client code.

### 15.9 Reporting Export Upgrade

Planned exports:

- PDF report for Friday cycle.
- Excel export if dependency is approved, otherwise keep CSV and document decision.
- Donor receipt/share view.

Rules:

- Export totals must match central report calculation.
- Public exports must exclude donor email/phone.
- Donor receipt must be tied to order/status and not reveal other donors.

### 15.10 Admin Productivity Tools

Planned tools:

- Quick expense templates.
- Bulk expense CSV import with preview.
- Per-row validation errors.
- Audit log for import.

Rules:

- Bulk import must not create partial confusing data without clear report.
- Imported expenses must go through same validation and audit rules as manual expenses.
- This is not inventory management and must not grow into complex accounting without a new explicit phase.

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

## 4. Architecture Principles

- Server owns all trusted business logic.
- Client never receives Midtrans server key.
- Client never decides final payment status.
- Webhook must verify Midtrans signature before changing donation status.
- Donation report only counts successful payments.
- Public report must never expose private donor email or phone.
- Admin-only operations must be checked on server.
- Changes to financial records must be auditable.

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

## 13. Deployment Notes

Minimum production checklist:

- Production Midtrans keys configured.
- Webhook URL registered in Midtrans dashboard.
- Database migrations applied.
- Admin account created securely.
- Environment variables configured.
- Public report tested.
- QRIS payment tested in production with small amount if allowed.

## 14. Non-Goals for MVP

- Native mobile app.
- Payroll deduction.
- Recurring auto donation.
- Multi-branch support.
- Inventory management.
- Complex accounting system.

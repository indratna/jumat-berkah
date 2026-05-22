# Jumat Berkah

Aplikasi web donasi Jumat Berkah untuk donasi QRIS Midtrans dan laporan pemasukan/pengeluaran transparan.

## Documentation

- `AGENTS.md` — aturan kerja AI builder.
- `PRD.md` — scope produk dan acceptance criteria.
- `TECHNICAL_SPEC.md` — arsitektur, database, API, payment, security.
- `IMPLEMENTATION_PLAN.md` — phase checklist dan progress tracker.

## Getting Started

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Main Routes

- `/` — landing program.
- `/donasi` — form donasi publik.
- `/donasi/status/[orderId]` — status pembayaran donasi.
- `/laporan` — laporan publik pemasukan, pengeluaran, dan saldo.
- `/masuk` — login opsional donatur.
- `/akun/donasi` — riwayat donasi pribadi.
- `/login` — login admin.
- `/admin` — dashboard admin.
- `/admin/donasi` — daftar dan filter donasi admin.
- `/admin/pengeluaran` — manajemen pengeluaran.
- `/api/admin/reports/export` — export CSV admin.

## Validation

```bash
npm run lint
npm run build
npm test
```

## Environment

Copy `.env.example` to `.env.local` for local development and replace placeholders with real local/sandbox values.

Never commit real `.env` files.

Required deployment values:

- `DATABASE_URL`
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY`
- `MIDTRANS_IS_PRODUCTION`
- `MIDTRANS_MERCHANT_ID`
- `MIDTRANS_ENABLED_PAYMENTS`
- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_NAME`
- `DONOR_LOGIN_CODE`

## Production Deployment Checklist

1. Configure production database and apply Prisma migrations.
2. Configure production Midtrans keys on host.
3. Set `NEXT_PUBLIC_APP_URL` to public HTTPS app URL.
4. Register Midtrans webhook URL: `/api/webhooks/midtrans`.
5. Generate strong `AUTH_SECRET`.
6. Create first admin with `npm run seed:admin` after setting admin env values.
7. Run `npm run lint`, `npm run build`, and `npm test` before release.
8. Test public donation, webhook settlement, public report, admin login, expense management, and CSV export on staging.
9. Before production QRIS launch, test small payment if allowed by Midtrans account policy.

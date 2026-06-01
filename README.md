# Jumat Berkah

Jumat Berkah is an open-source web application for community donation management. It helps a program accept QRIS donations through Midtrans, reconcile payment status through webhooks, manage expenses, and publish transparent income/expense reports.

The app is built for Indonesian donation workflows where public trust, donor privacy, and simple admin operations matter.

## Features

- Public landing page and donation flow.
- QRIS payment through Midtrans Snap with redirect fallback.
- Midtrans webhook verification and idempotent status handling.
- Public transparency report with income, expenses, balance, exports, and print view.
- Admin dashboard for donations, donors, expenses, approvals, audit logs, weekly targets, and distribution stories.
- Optional donor login and private donation history.
- Telegram bot notifications, admin commands, public report broadcast, and scheduled alerts.
- Optional Resend email notifications and password reset.
- Optional WhatsApp Cloud API donation reminders with explicit consent.
- PostgreSQL backup and restore-drill scripts.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- Better Auth
- Midtrans Snap/Core API

## Quick Start

Install dependencies:

```bash
npm install
```

Copy environment placeholders:

```bash
cp .env.example .env.local
```

Generate Prisma client:

```bash
npm run db:generate
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

See `docs/ENV_SETUP.md` for full local, sandbox, and production environment guidance.

## Validation

Run before deploying or opening a pull request:

```bash
npm run lint
npm test
npm run build
```

## Main Routes

| Route | Purpose |
|---|---|
| `/` | Public landing page |
| `/donasi` | Public donation form |
| `/donasi/status/[orderId]` | Donation payment status |
| `/laporan` | Public transparency report |
| `/tentang` | Program information |
| `/masuk` | Optional donor login |
| `/akun/donasi` | Donor donation history |
| `/login` | Admin login |
| `/admin` | Admin dashboard |
| `/admin/donasi` | Admin donation management |
| `/admin/donatur` | Admin donor database |
| `/admin/pengeluaran` | Expense management |
| `/admin/penyaluran` | Distribution story management |
| `/admin/audit` | Audit log viewer |

## Documentation

Start with `docs/README.md` for the full documentation index.

Key documents:

- `docs/FEATURES.md` — feature overview and smoke tests.
- `docs/ENV_SETUP.md` — environment variables and provider setup.
- `docs/PRODUCTION_CHECKLIST.md` — production readiness checklist.
- `docs/BETTER_AUTH_SETUP.md` — Better Auth and Google OAuth setup.
- `docs/BACKUP_RESTORE_RUNBOOK.md` — PostgreSQL backup and restore drill.
- `docs/SECRET_ROTATION_RUNBOOK.md` — secret rotation checklist.
- `docs/REPORT_EXPORTS.md` — report export behavior.
- `PRD.md` — product requirements.
- `TECHNICAL_SPEC.md` — technical architecture and business rules.

## Security and Privacy

- Never commit real `.env` files or provider secrets.
- Midtrans server key, Telegram token, Google OAuth secret, Resend API key, WhatsApp token, cron secret, and database credentials must stay server-only.
- Public reports must never expose donor email or phone.
- Anonymous or hidden donors must display as `Anonim`.
- Money is stored as integer Rupiah.
- Final payment status comes from verified Midtrans webhooks, not client callbacks.

See `SECURITY.md` for vulnerability reporting and secret handling policy.

## Contributing

Contributions are welcome. Please read `CONTRIBUTING.md` before opening issues or pull requests.

## License

MIT License. See `LICENSE`.

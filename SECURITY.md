# Security Policy

Jumat Berkah handles donation records, payment webhooks, admin access, and donor contact data. Please report security issues privately and do not publish exploit details before a fix is available.

## Supported Versions

The `main` branch receives security fixes while the project is active.

## Reporting a Vulnerability

If you find a vulnerability:

1. Do not open a public GitHub issue with exploit details.
2. Contact the project maintainer privately through the repository owner's listed contact channel.
3. Include affected route, impact, reproduction steps, and any relevant logs without secrets.

If no private contact is listed, open a public issue that says only: `Security report available; please provide a private contact.`

## Secret Handling

Never commit real values for:

- `.env` files.
- Midtrans server keys.
- Telegram bot tokens or webhook secrets.
- Google OAuth client secrets.
- Resend API keys.
- WhatsApp Cloud API tokens.
- Database URLs with live credentials.
- Backup, cron, or receipt signing secrets.

Use `.env.example` placeholders and hosting secret managers for live values.

## Security Expectations

- Server verifies Midtrans webhook signatures before changing donation state.
- Server verifies Telegram webhook secret tokens before processing bot updates.
- Admin pages and APIs require server-side authorization.
- Public reports must not expose donor email or phone.
- Anonymous or hidden donors must display as `Anonim`.
- Money is stored as integer Rupiah, not floating point.

# Contributing

Thanks for your interest in improving Jumat Berkah.

## Development Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment placeholders:

   ```bash
   cp .env.example .env.local
   ```

3. Fill `.env.local` with local or sandbox values. Do not use live secrets for routine development.

4. Generate Prisma client:

   ```bash
   npm run db:generate
   ```

5. Run the development server:

   ```bash
   npm run dev
   ```

## Validation

Run these before opening a pull request:

```bash
npm run lint
npm test
npm run build
```

## Contribution Guidelines

- Keep changes focused and small.
- Do not commit real `.env` files or provider secrets.
- Keep payment logic server-only.
- Validate external input at server boundaries.
- Preserve public donor privacy rules: no email or phone in public reports.
- Store money as integer Rupiah.
- Do not trust client-side payment status; Midtrans webhook is source of truth.
- Add or update tests when changing business rules, auth, payment, reporting, or data export behavior.
- Use Indonesian copy for user-facing text.

## Pull Request Checklist

- [ ] Change is scoped and described clearly.
- [ ] `npm run lint` passes.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] Documentation updated when setup, env, deployment, or user-facing behavior changes.
- [ ] No secrets, private donor data, local notes, or generated build artifacts are committed.

## Reporting Security Issues

Please follow `SECURITY.md` instead of opening public issues with exploit details.

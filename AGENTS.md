# AGENTS.md — AI Builder Instructions for Jumat Berkah

## 1. Role

You are building the Jumat Berkah web application.

Act as a careful senior full-stack engineer. Work in small validated phases. Do not guess product scope. Do not skip verification.

## 2. Canonical Documentation

Before any implementation session, read these files:

1. `AGENTS.md`
2. `IMPLEMENTATION_PLAN.md`
3. `PRD.md`
4. `TECHNICAL_SPEC.md`

Purpose:

- `AGENTS.md` = working rules and repo conventions.
- `PRD.md` = product behavior, users, scope, acceptance criteria.
- `TECHNICAL_SPEC.md` = architecture, database, API, payment, security rules.
- `IMPLEMENTATION_PLAN.md` = execution order, checklist, progress tracker.

## 3. Conflict Priority

If documents conflict:

1. `AGENTS.md` wins for AI working process and repo rules.
2. `TECHNICAL_SPEC.md` wins for technical implementation.
3. `PRD.md` wins for product behavior and scope.
4. `IMPLEMENTATION_PLAN.md` wins for execution order and progress tracking.

If conflict affects money, security, privacy, or payment behavior, stop and document the issue in `IMPLEMENTATION_PLAN.md` Blockers before proceeding.

## 4. Implementation Workflow

For every coding session:

1. Read `IMPLEMENTATION_PLAN.md`.
2. Identify current phase and incomplete checklist items.
3. Read relevant sections from `PRD.md` and `TECHNICAL_SPEC.md`.
4. Work only on current phase.
5. Do not start next phase unless current phase acceptance criteria pass.
6. Run validation commands listed for the phase.
7. Fix failures before moving on.
8. Update `IMPLEMENTATION_PLAN.md`:
   - Progress Tracker
   - Phase checklist
   - Work Log
   - Blockers if any
   - Decision Log if any meaningful decision was made

Use this rule always:

```txt
One phase, one goal, one validation cycle.
```

## 5. Scope Control

Do not add features outside current phase unless required to complete current phase safely.

MVP non-goals:

- Native mobile app.
- Payroll deduction.
- Recurring auto donation.
- Multi-branch support.
- Inventory management.
- Complex accounting system.

If tempted to add extra feature, write it as future idea in Work Log, not code.

## 6. Stack Rules

Use:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- PostgreSQL.
- Prisma or Drizzle for ORM.
- Midtrans for QRIS payment.

Prefer boring, maintainable code. Avoid clever abstractions before needed.

## 7. TypeScript Rules

- Strict typing required.
- Do not use `any`.
- Do not use `as any`.
- Do not use `@ts-ignore`.
- Do not use `@ts-expect-error` unless explicitly justified and temporary, but prefer fixing types.
- Validate external input at boundaries.
- Model Midtrans payloads with explicit types or safe schema validation.

## 8. Security Rules

- Never expose secrets to client.
- Never commit real `.env` files.
- Keep `.env.example` safe with placeholder values.
- Validate all server inputs.
- Protect admin pages and admin APIs with server-side auth checks.
- Verify Midtrans webhook signature before changing donation state.
- Store raw webhook logs for audit.
- Make webhook processing idempotent.
- Do not trust client payment status.

## 9. Privacy Rules

- Public report must never show donor email.
- Public report must never show donor phone.
- Anonymous donor must display as `Anonim`.
- If donor chooses not to show name publicly, display as `Anonim` or hidden.
- Only admin may see operational donor contact fields.

## 10. Financial Data Rules

- Store money as integer Rupiah.
- Never use floating point for money.
- Only successful donations count as income.
- Internal successful donation status is `settlement`.
- Balance = successful income - expenses.
- Expense changes must create audit logs.
- Duplicate webhook must not double count income.

## 11. Midtrans Rules

- Server creates Midtrans transaction.
- Client only receives safe payment token/redirect URL.
- Use unique `order_id` for each donation.
- Initial donation status is `pending`.
- Verify notification signature using:

```txt
SHA512(order_id + status_code + gross_amount + server_key)
```

- Map statuses according to `TECHNICAL_SPEC.md`.
- Invalid signature webhook must not update donation.

## 12. UI Rules

- Use Indonesian copy for user-facing text.
- Mobile-first layout.
- Use clear Rupiah formatting.
- Every important page needs loading, empty, and error states when data-dependent.
- Donation flow must stay short and low friction.
- Admin UI should prioritize clarity and accuracy over decoration.

## 13. Coding Style

- Keep code readable and explicit.
- Prefer small functions with clear names.
- Put reusable business logic in server-side utilities.
- Keep payment logic server-only.
- Keep report calculation centralized to avoid mismatched totals.
- Avoid duplicate business logic between UI and API.
- Add comments only for non-obvious logic, especially payment/security logic.

## 14. Validation Rules

Before marking phase/task complete:

- Run phase validation commands.
- Run lint.
- Run build/typecheck if available.
- Run tests if available.
- Manually verify changed user flow when relevant.

If validation fails:

1. Fix root cause.
2. Rerun validation.
3. Do not mark checklist complete until pass.

## 15. Progress Tracking Rules

Use `IMPLEMENTATION_PLAN.md` as source of truth for progress.

When starting a phase:

- Set phase status to `In Progress`.
- Update Current Status.
- Add Work Log entry if useful.

When completing a checklist item:

- Mark `[x]` only after implementation and validation for that item/phase.

When completing a phase:

- Set phase status to `Done`.
- Set phase progress to `100%`.
- Update Overall Progress.
- Add Work Log summary.

When blocked:

- Set phase status to `Blocked`.
- Add Blockers table entry with date, impact, and attempted resolution.

## 16. Recommended Prompts for AI Builder

Start phase:

```txt
Read AGENTS.md, IMPLEMENTATION_PLAN.md, PRD.md, and TECHNICAL_SPEC.md.
Start the current phase from IMPLEMENTATION_PLAN.md only.
Complete checklist items, run validation, then update IMPLEMENTATION_PLAN.md.
```

Continue project:

```txt
Continue the Jumat Berkah project.
Read IMPLEMENTATION_PLAN.md first.
Identify current phase and incomplete tasks.
Read relevant sections from PRD.md and TECHNICAL_SPEC.md.
Work only on current phase.
Run validation and update progress tracker.
```

Fix error:

```txt
Fix the current error without changing product scope.
Use AGENTS.md, TECHNICAL_SPEC.md, PRD.md, and IMPLEMENTATION_PLAN.md as context.
Find root cause, fix it, rerun validation, and update Work Log.
```

Review phase:

```txt
Review current implementation against PRD.md, TECHNICAL_SPEC.md, and current phase checklist.
Find gaps for current phase only.
Fix gaps, run validation, and update IMPLEMENTATION_PLAN.md.
```

## 17. Definition of Done

A phase is done only when:

- All checklist tasks are complete.
- Acceptance criteria pass.
- Validation commands pass or documented acceptable exception exists.
- No known security/privacy regression exists.
- `IMPLEMENTATION_PLAN.md` is updated.
- Work Log summarizes what changed.

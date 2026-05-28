# Pre-Push Cleanup and Light Refactor Design

Date: 2026-05-28
Status: Approved for planning

## Goal

Prepare Jumat Berkah for a safe GitHub push by cleaning development artifacts,
reducing low-risk code duplication, and keeping product behavior unchanged.

## Scope

This pass will use a conservative cleanup strategy:

- Remove or ignore local/generated development artifacts such as dev-server logs,
  Playwright MCP output, and one-off mockup files when they are not required by
  the app.
- Audit currently modified and untracked files before changing them.
- Apply light refactors only when risk is low and behavior remains equivalent.
- Prefer small improvements: import cleanup, reusable UI helpers/components,
  duplicate Tailwind class reduction, dead code removal, and folder hygiene.
- Update `IMPLEMENTATION_PLAN.md` Work Log after validation.
- Prepare a clear commit for GitHub push.

## Out of Scope

This pass will not perform deep refactors or architecture rewrites. It will not
change database schema, payment behavior, auth behavior, Midtrans webhook logic,
financial calculations, privacy rules, Telegram/WhatsApp provider behavior, or
product scope.

Deep refactor can happen later as its own planned phase after this safe push.

## Approach

Recommended approach: safe cleanup plus opportunistic low-risk refactor.

1. Inspect Git status and diffs.
2. Identify artifacts that should not be committed.
3. Update ignore rules for repeatable generated files.
4. Apply focused refactors only where the code smell is obvious and the change is
   easy to validate.
5. Run validation commands.
6. Update progress documentation.
7. Stage and commit the cleaned state with a clear message.

## Risk Controls

- Keep changes small and reversible.
- Avoid payment, auth, webhook, and financial logic unless the change is purely
  formatting/import cleanup.
- Do not rename public routes unless required, which is not expected here.
- Do not remove files unless they are clearly local artifacts or replaced by a
  safer tracked equivalent.
- Use validation output as the completion gate.

## Validation

Run these commands before marking work complete:

```sh
npm run lint
npm test
npm run build
git --no-pager diff --stat
git --no-pager status --short
```

If validation fails, fix the root cause and rerun the failing command.

## Success Criteria

- Development artifacts are removed or ignored.
- Remaining tracked changes are intentional.
- Light refactors keep existing behavior unchanged.
- Lint, tests, and build pass.
- `IMPLEMENTATION_PLAN.md` records the cleanup pass.
- Repository is ready for a clear GitHub push commit.

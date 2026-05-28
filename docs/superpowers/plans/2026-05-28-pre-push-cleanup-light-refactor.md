# Pre-Push Cleanup and Light Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare Jumat Berkah for a safe GitHub push by cleaning local artifacts, applying low-risk refactors, validating the app, and documenting the cleanup.

**Architecture:** Use a conservative pass that separates artifact cleanup, ignore-rule hardening, code audit, small behavior-preserving refactors, validation, and Git preparation. Do not change runtime behavior for auth, payment, webhooks, reports, financial calculations, database schema, or provider integrations.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Prisma/PostgreSQL, npm scripts, Git.

---

## File Structure

Expected files to inspect or modify:

- Modify: `JumatBerkah/.gitignore` — ignore repeatable local/generated artifacts.
- Delete if unneeded: `JumatBerkah/dev-server.log`, `JumatBerkah/dev-server-3042.log`, `JumatBerkah/dev-server-3043.log`, `JumatBerkah/dev-server-3044.log`, `JumatBerkah/dev-server-3044.err.log` — local dev server logs.
- Delete if unneeded: `JumatBerkah/.playwright-mcp/` — local Playwright MCP snapshots/logs.
- Delete if unneeded: `JumatBerkah/ui-mockup-jumat-berkah.html` — one-off local mockup not imported by app code.
- Inspect: `JumatBerkah/IMPLEMENTATION_PLAN.md` — update Work Log only after validation passes.
- Inspect: `JumatBerkah/src/app/admin/**/*.tsx` — likely light UI cleanup/refactor candidates.
- Inspect: `JumatBerkah/src/components/admin/*.tsx` — reusable admin UI components.
- Inspect: `JumatBerkah/src/lib/*.ts` — only format/import/dead-code cleanup; avoid business logic changes.
- Inspect: `JumatBerkah/eslint.config.mjs`, `JumatBerkah/next.config.ts` — ensure existing config changes are intentional.

Do not create new product features. New helper files are allowed only if they reduce obvious duplication without behavior change.

---

### Task 1: Snapshot Current Git State

**Files:**
- Inspect only: full repo state

- [ ] **Step 1: Capture short status**

Run:

```sh
git --no-pager status --short
```

Expected: list modified/untracked files. Save mental note of untracked artifacts and existing modified files.

- [ ] **Step 2: Capture stat of tracked changes**

Run:

```sh
git --no-pager diff --stat
```

Expected: diff stat appears. Do not edit yet.

- [ ] **Step 3: Inspect untracked docs separately**

Run:

```sh
git --no-pager status --short docs/superpowers
```

Expected: plan/spec files appear if not yet tracked. Keep approved design/plan docs; do not delete them.

- [ ] **Step 4: No commit for snapshot task**

Expected: no commit. This task only establishes baseline.

---

### Task 2: Remove Local Development Artifacts Safely

**Files:**
- Delete if present: `JumatBerkah/dev-server.log`
- Delete if present: `JumatBerkah/dev-server-3042.log`
- Delete if present: `JumatBerkah/dev-server-3043.log`
- Delete if present: `JumatBerkah/dev-server-3044.log`
- Delete if present: `JumatBerkah/dev-server-3044.err.log`
- Delete if present: `JumatBerkah/.playwright-mcp/`
- Delete if present and unreferenced: `JumatBerkah/ui-mockup-jumat-berkah.html`

- [ ] **Step 1: Verify mockup is not referenced**

Run:

```sh
git --no-pager grep -n "ui-mockup-jumat-berkah" -- .
```

Expected: no matches. If matches exist, stop and inspect before deleting.

- [ ] **Step 2: Delete log files**

Run:

```sh
rm -f dev-server.log dev-server-3042.log dev-server-3043.log dev-server-3044.log dev-server-3044.err.log
```

Expected: command exits with no output.

- [ ] **Step 3: Delete Playwright MCP artifacts**

Run:

```sh
rm -rf .playwright-mcp
```

Expected: command exits with no output.

- [ ] **Step 4: Delete unreferenced mockup file**

Run:

```sh
rm -f ui-mockup-jumat-berkah.html
```

Expected: command exits with no output.

- [ ] **Step 5: Confirm artifacts are gone from status**

Run:

```sh
git --no-pager status --short
```

Expected: deleted local artifact paths no longer appear as untracked files.

- [ ] **Step 6: Commit artifact deletion only if tracked deletions exist**

Run:

```sh
git --no-pager status --short dev-server.log dev-server-3042.log dev-server-3043.log dev-server-3044.log dev-server-3044.err.log .playwright-mcp ui-mockup-jumat-berkah.html
```

Expected: normally no output because these were untracked. If tracked deletions appear, include them later in final cleanup commit, not separate commit.

---

### Task 3: Harden Ignore Rules for Generated Artifacts

**Files:**
- Modify: `JumatBerkah/.gitignore`

- [ ] **Step 1: Read existing ignore file**

Run:

```sh
cat .gitignore
```

Expected: current ignore rules appear.

- [ ] **Step 2: Add local artifact rules if missing**

Append only missing lines under a local tooling section:

```gitignore
# Local development artifacts
.playwright-mcp/
dev-server*.log
*.err.log
ui-mockup-*.html
```

Expected: `.gitignore` contains each rule once. Do not duplicate existing rules.

- [ ] **Step 3: Verify ignore behavior**

Run:

```sh
git check-ignore .playwright-mcp/console-example.log dev-server-3044.log dev-server-3044.err.log ui-mockup-jumat-berkah.html
```

Expected output includes all four paths.

- [ ] **Step 4: Check diff is only ignore rules**

Run:

```sh
git --no-pager diff -- .gitignore
```

Expected: only local artifact ignore rules changed.

- [ ] **Step 5: Defer commit**

Expected: no commit yet. Commit after validation.

---

### Task 4: Audit Modified Files for Risk Boundaries

**Files:**
- Inspect: `JumatBerkah/src/app/admin/**/*.tsx`
- Inspect: `JumatBerkah/src/components/admin/*.tsx`
- Inspect: `JumatBerkah/src/lib/*.ts`
- Inspect: `JumatBerkah/eslint.config.mjs`
- Inspect: `JumatBerkah/next.config.ts`
- Inspect: `JumatBerkah/all about berkah karyo.txt`

- [ ] **Step 1: List modified tracked files**

Run:

```sh
git --no-pager diff --name-only
```

Expected: list of modified tracked files.

- [ ] **Step 2: Inspect high-risk files touched by current diff**

Run:

```sh
git --no-pager diff -- src/lib/midtrans.ts src/lib/reports.ts src/lib/donations.ts src/lib/telegram.ts src/lib/whatsapp-reminders.ts src/lib/better-auth.ts src/lib/better-auth-guards.ts src/lib/auth-authorization.ts
```

Expected: either no changes or only previously intended safe changes. If behavior changes appear, do not refactor these files further.

- [ ] **Step 3: Inspect config changes**

Run:

```sh
git --no-pager diff -- eslint.config.mjs next.config.ts
```

Expected: config changes should be intentional and related to existing validation/worktree setup. Do not broaden ignores beyond necessary generated output.

- [ ] **Step 4: Inspect admin UI changed areas**

Run:

```sh
git --no-pager diff -- src/app/admin src/components/admin
```

Expected: mostly UI/styling changes. Identify repeated class strings, repeated card wrappers, or dead imports safe to clean.

- [ ] **Step 5: Inspect freeform note file**

Run:

```sh
git --no-pager diff -- "all about berkah karyo.txt"
```

Expected: determine whether it is documentation content intentionally changed. Do not delete unless user explicitly confirms it is disposable.

---

### Task 5: Apply Low-Risk UI Refactors Only Where Obvious

**Files:**
- Modify if needed: `JumatBerkah/src/app/admin/page.tsx`
- Modify if needed: `JumatBerkah/src/app/admin/donasi/page.tsx`
- Modify if needed: `JumatBerkah/src/app/admin/donatur/page.tsx`
- Modify if needed: `JumatBerkah/src/app/admin/pengeluaran/page.tsx`
- Modify if needed: `JumatBerkah/src/components/admin/admin-status-badge.tsx`
- Modify if needed: `JumatBerkah/src/components/admin/admin-summary-footer.tsx`
- Modify if needed: `JumatBerkah/src/components/admin/admin-top-tabs.tsx`

- [ ] **Step 1: Search for unused imports after existing changes**

Run:

```sh
npx eslint src/app/admin src/components/admin
```

Expected: pass or report actionable lint errors. Fix only lint issues in admin UI files.

- [ ] **Step 2: Search for repeated admin card class strings**

Run:

```sh
git --no-pager grep -n "rounded-\[2rem\].*border.*bg-white" -- src/app/admin src/components/admin
```

Expected: repeated class strings may appear. If many identical patterns appear in one file, extract local constants in that same file. If patterns are already centralized, skip.

- [ ] **Step 3: Extract local class constants only when file-local duplication is obvious**

Example pattern for one file:

```tsx
const panelClassName =
  "rounded-[2rem] border border-slate-200 bg-white shadow-sm";
```

Use it like:

```tsx
<section className={panelClassName}>
  {/* existing content unchanged */}
</section>
```

Expected: rendered markup classes remain equivalent.

- [ ] **Step 4: Do not create broad class abstraction if only used once**

Expected: no new abstraction for one-off styling.

- [ ] **Step 5: Run targeted lint after UI cleanup**

Run:

```sh
npx eslint src/app/admin src/components/admin
```

Expected: pass.

---

### Task 6: Apply Low-Risk Utility Cleanup Only If Lint Reveals It

**Files:**
- Modify if needed: `JumatBerkah/src/lib/format.ts`
- Modify if needed: other `JumatBerkah/src/lib/*.ts` files with lint-only issues

- [ ] **Step 1: Run lint on server utilities**

Run:

```sh
npx eslint src/lib
```

Expected: pass or actionable lint errors.

- [ ] **Step 2: Fix only lint/import/dead-code issues**

Allowed changes:

```ts
// Remove unused imports.
// Remove unused local constants.
// Keep exported function names and return values unchanged.
```

Expected: no changes to payment/auth/report calculations unless purely unused import removal.

- [ ] **Step 3: Run targeted lint again**

Run:

```sh
npx eslint src/lib
```

Expected: pass.

---

### Task 7: Validate Full App

**Files:**
- No direct edits unless validation fails because of cleanup/refactor

- [ ] **Step 1: Run lint**

Run:

```sh
npm run lint
```

Expected: command exits successfully.

- [ ] **Step 2: Run tests**

Run:

```sh
npm test
```

Expected: all tests pass. Latest known baseline was `98/98`.

- [ ] **Step 3: Run production build**

Run:

```sh
npm run build
```

Expected: build succeeds. Existing local warning about low-entropy `BETTER_AUTH_SECRET` may appear; it is acceptable only if build exits successfully and warning is already documented.

- [ ] **Step 4: Inspect final diff stat**

Run:

```sh
git --no-pager diff --stat
```

Expected: diff is limited to approved cleanup/refactor/docs changes.

---

### Task 8: Update Implementation Plan Work Log

**Files:**
- Modify: `JumatBerkah/IMPLEMENTATION_PLAN.md`

- [ ] **Step 1: Add Work Log entry at top of `2026-05-28` section**

Add this entry, adjusting validation counts only if actual output differs:

```markdown
- Completed pre-push cleanup and light refactor pass. Removed local development artifacts, hardened `.gitignore` for repeatable generated files, audited current tracked changes, applied only low-risk behavior-preserving cleanup, and kept auth/payment/webhook/database/financial/provider behavior unchanged. Validation passed: `npm run lint`, `npm test` (98/98), `npm run build`. Build still warns local `BETTER_AUTH_SECRET` is low entropy; production follow-up remains to set a strong secret.
```

Expected: entry accurately reflects actual validation results. If validation failed and remains unresolved, do not use this text; document blocker instead.

- [ ] **Step 2: Do not alter phase status unless needed**

Expected: Phase 39 remains `Done` and overall progress remains `100%` unless new phase is explicitly added, which is not needed for this cleanup.

- [ ] **Step 3: Review doc diff**

Run:

```sh
git --no-pager diff -- IMPLEMENTATION_PLAN.md
```

Expected: Work Log entry only, no unrelated progress changes.

---

### Task 9: Final Git Review and Commit

**Files:**
- Stage intentional cleanup/refactor/docs files only

- [ ] **Step 1: Show final status**

Run:

```sh
git --no-pager status --short
```

Expected: no local artifact files appear. Only intentional modified/untracked docs/code remain.

- [ ] **Step 2: Review final diff summary**

Run:

```sh
git --no-pager diff --stat
```

Expected: summary matches cleanup/refactor scope.

- [ ] **Step 3: Stage intentional files**

Run after reviewing paths:

```sh
git add .gitignore IMPLEMENTATION_PLAN.md eslint.config.mjs next.config.ts src docs "all about berkah karyo.txt"
```

Expected: only intentional files staged. If `all about berkah karyo.txt` is not intentional, do not stage it.

- [ ] **Step 4: Inspect staged summary**

Run:

```sh
git --no-pager diff --cached --stat
```

Expected: staged files match approved cleanup/refactor and existing intentional Phase 39 changes.

- [ ] **Step 5: Commit with clear message**

Run:

```sh
git commit -m "Clean up project before GitHub push"
```

Expected: commit succeeds.

- [ ] **Step 6: Verify branch state**

Run:

```sh
git --no-pager status --short
```

Expected: clean working tree or only intentionally untracked local files not meant for commit.

---

### Task 10: Push Readiness Check

**Files:**
- Inspect only

- [ ] **Step 1: Confirm latest commits**

Run:

```sh
git --no-pager log -3 --oneline
```

Expected: latest commit is `Clean up project before GitHub push`; design commit may appear below it.

- [ ] **Step 2: Confirm remote**

Run:

```sh
git remote -v
```

Expected: `origin` points to intended GitHub repository.

- [ ] **Step 3: Push only after user confirms**

Run only with user approval:

```sh
git push origin main
```

Expected: push succeeds. If rejected because remote moved, run `git --no-pager fetch origin` and inspect before merging or rebasing.

---

## Self-Review

Spec coverage:

- Artifact cleanup: Task 2 and Task 3.
- Audit before changing: Task 1 and Task 4.
- Low-risk refactor only: Task 5 and Task 6.
- Validation: Task 7.
- Progress doc update: Task 8.
- Git preparation: Task 9 and Task 10.
- No deep refactor/product behavior changes: Risk controls plus Task 4–6 constraints.

Placeholder scan:

- No `TBD`, `TODO`, or unspecified implementation steps remain.
- Commands and expected outcomes are explicit.

Type consistency:

- No new public types or APIs are introduced by this plan.
- Any class constants are file-local and optional; exported behavior remains unchanged.

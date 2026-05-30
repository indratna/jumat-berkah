# Admin Profile Page Inside Admin Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only profile page at `/admin/profil` that reuses the existing profile and password forms inside the admin shell. Sidebar `Profil Admin` link points to the new admin route. `/akun/profil` keeps working for donors.

**Architecture:** Create `src/app/admin/profil/page.tsx` that runs inside `src/app/admin/layout.tsx` (so the admin sidebar/header is preserved). Reuse `getCurrentAccountProfile`, `ProfileForm`, and `PasswordChangeForm` from the existing donor profile page by importing them by relative path. Update sidebar nav and reachability test.

**Tech Stack:** Next.js App Router, React server component, TypeScript, Tailwind CSS.

---

### Task 1: Admin profile page

**Files:**
- Create: `src/app/admin/profil/page.tsx`

- [x] **Step 1: Render admin profile content**

Server component reads `getCurrentAccountProfile()` and rejects non-admin sessions by redirecting to `/admin`. Reuse `ProfileForm` and `PasswordChangeForm` from `src/app/akun/profil/`.

### Task 2: Sidebar link and test

**Files:**
- Modify: `src/components/admin/admin-sidebar.tsx`
- Modify: `src/tests/business-rules.test.ts`

- [x] **Step 1: Update sidebar entry**

Change the `Profil Admin` nav item under `Pengaturan` to `href: "/admin/profil"`.

- [x] **Step 2: Update reachability test**

Replace `/akun/profil` with `/admin/profil` in the admin reachability test array.

### Task 3: Validate

- [x] **Step 1: Run validation**

Run `npm run lint`, `npm test`, and `npm run build`. Manually verify `/admin/profil` renders inside admin layout, `/akun/profil` still works for donors.

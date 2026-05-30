# Admin Sidebar Header Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move sidebar collapse control into the admin header and remove the expandable Dashboard group.

**Architecture:** Add a small client shell for admin layout state. Keep `AdminLayout` as a server component for auth and notification fetching, while `AdminShell` owns `expanded` state, CSS sidebar width var, header toggle, and renders `AdminSidebar`.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Tailwind CSS.

---

### Task 1: Extract admin shell state

**Files:**
- Create: `src/components/admin/admin-shell.tsx`
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/components/admin/admin-sidebar.tsx`

- [x] **Step 1: Create `AdminShell` client component**

Create `src/components/admin/admin-shell.tsx` with `expanded` state, `--admin-sidebar-width` effect, header collapse button, `ThemeToggle`, `NotificationBell`, and admin avatar.

- [x] **Step 2: Simplify `AdminLayout`**

Keep auth and notification fetch in `src/app/admin/layout.tsx`, then render `AdminShell` with `notifications` and `children`.

- [x] **Step 3: Make `AdminSidebar` controlled**

Change `AdminSidebar` to accept `expanded: boolean`. Remove its local `expanded` state, width effect, and old text collapse button.

- [x] **Step 4: Flatten Dashboard navigation**

Render Dashboard as one direct `Link` above grouped nav. Keep Masuk, Keluar, Pengaturan groups expandable.

- [x] **Step 5: Validate**

Run `npm run lint`, `npm test`, and `npm run build`. Manually verify `/admin` header toggle collapses/expands sidebar and Dashboard has no expandable sub-item.

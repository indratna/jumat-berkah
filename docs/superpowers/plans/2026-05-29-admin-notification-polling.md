# Admin Notification Polling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poll admin notifications softly while the admin tab is visible so the bell updates without manual reload.

**Architecture:** Add `GET /api/admin/notifications` route that returns the same payload as `getAdminNotifications()`, guarded by existing admin checks. The `NotificationBell` client component polls every 30 seconds while the page is visible and updates its local list and unread count.

**Tech Stack:** Next.js App Router, React client component, TypeScript.

---

### Task 1: Notifications GET API

**Files:**
- Modify: `src/app/api/admin/notifications/read/route.ts` (no change but referenced for guard pattern)
- Create: `src/app/api/admin/notifications/route.ts`

- [x] **Step 1: Implement GET handler**

GET resolves admin session via legacy cookie or Better Auth, then returns `getAdminNotifications()` JSON. Returns 401 when unauthorized.

### Task 2: Bell polling

**Files:**
- Modify: `src/components/admin/notification-bell.tsx`

- [x] **Step 1: Add polling state**

Move `items` and `count` to state initialised from props, then on mount start a 30s `setInterval` that calls `GET /api/admin/notifications` only when `document.visibilityState === "visible"`. Pause/resume on `visibilitychange`. On response update both `items` and `count` (only when not pending mark-as-read).

- [x] **Step 2: Keep mark-as-read behaviour**

Existing `openPanel` keeps marking as read via PATCH and resets local `count` to 0.

### Task 3: Validate

- [x] **Step 1: Run validation**

Run `npm run lint`, `npm test`, and `npm run build`. Manually verify by inserting a notification and waiting up to 30 seconds; bell counter should update without reload.

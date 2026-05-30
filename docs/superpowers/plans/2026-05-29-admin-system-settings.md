# Admin System Settings Status Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only `/admin/pengaturan/sistem` page that shows whether each environment-driven configuration is set, without exposing secret values to the client.

**Architecture:** A server component reads `process.env` through a server-only helper, returns sanitized status entries grouped by category, and renders them in cards/tables. No new API endpoints. Existing admin auth guards protect the page.

**Tech Stack:** Next.js App Router, React server component, TypeScript, Tailwind CSS.

---

### Task 1: Server-only system settings helper

**Files:**
- Create: `src/lib/system-settings.ts`

- [x] **Step 1: Define types and helper**

Create `getSystemSettings()` that returns an array of `SystemSettingGroup`:

```ts
export type SystemSettingStatus = "ok" | "missing" | "warning";

export type SystemSettingItem = {
  key: string;
  label: string;
  status: SystemSettingStatus;
  detail: string | null;
};

export type SystemSettingGroup = {
  id: string;
  label: string;
  description: string;
  items: SystemSettingItem[];
};
```

Cover groups and fields agreed in the design:

- Aplikasi: `NEXT_PUBLIC_APP_URL` (show value), `BETTER_AUTH_SECRET` (ok/warning if length < 32), `ADMIN_EMAIL` (mask), `ADMIN_LOGIN_CODE` (ok/missing).
- Database: `DATABASE_URL` (ok/missing).
- Midtrans: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION` (`production`/`sandbox`).
- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET_TOKEN`, `TELEGRAM_NOTIFY_CHAT_ID`, `TELEGRAM_PUBLIC_CHANNEL_ID`, `TELEGRAM_ADMIN_ALLOWLIST` (count of chat ids only).
- Email: `EMAIL_PROVIDER`, `EMAIL_FROM` (show value), `RESEND_API_KEY`, `ADMIN_EMAIL_NOTIFICATIONS` (count of recipients).
- WhatsApp: `WHATSAPP_ENABLED`, `WHATSAPP_PROVIDER`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`.
- Cron & Ops: `CRON_SECRET`, `TELEGRAM_LOW_BALANCE_THRESHOLD`, `TELEGRAM_LOW_TARGET_PROGRESS_PERCENT`, `EXPENSE_APPROVAL_THRESHOLD_RUPIAH`, `EXPENSE_APPROVAL_REQUIRED_COUNT`.

Never include token/secret values, raw chat ids, or admin login code values in the result.

- [x] **Step 2: Mask helper**

Add an internal `maskEmail(value: string)` helper used only inside `system-settings.ts`. Used for `ADMIN_EMAIL` only. Other secrets do not use mask, only `ok` or `missing`.

### Task 2: Admin page

**Files:**
- Create: `src/app/admin/pengaturan/sistem/page.tsx`

- [x] **Step 1: Server-render the page**

Server component checks legacy admin cookie or Better Auth admin (same pattern as `src/app/admin/layout.tsx`), then calls `getSystemSettings()` and renders cards per group with a table of `Pengaturan`, `Status`, `Catatan`.

Status badge:
- `ok` → green `Aktif`
- `missing` → amber `Belum diatur`
- `warning` → red `Perlu perhatian`

Footer of each card: `Diatur di file .env server. Hubungi ops untuk perubahan.`

### Task 3: Sidebar link

**Files:**
- Modify: `src/components/admin/admin-sidebar.tsx`
- Modify: `src/tests/business-rules.test.ts`

- [x] **Step 1: Add nav entry**

Add `{ href: "/admin/pengaturan/sistem", label: "Status Sistem", description: "Konfigurasi env", icon: "⚙" }` under the existing `Pengaturan` group.

- [x] **Step 2: Update navigation reachability test**

Add `/admin/pengaturan/sistem` to `expectedReachableRoutes`.

### Task 4: Validate

- [x] **Step 1: Run validation**

Run `npm run lint`, `npm test`, and `npm run build`. Manually verify `/admin/pengaturan/sistem` lists all groups, sensitive values are not shown, and missing entries display correctly.

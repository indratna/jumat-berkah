# Dashboard Calendar Date Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace dashboard slider date range with a calendar-style range picker placed in the dashboard hero header.

**Architecture:** Rework the existing `DashboardDateRange` client component into a self-contained popover calendar that reads `from`/`to`, lets admin select start/end dates, and updates `/admin?from=...&to=...` on apply. Move component placement from the body below the hero into the right side of the hero header.

**Tech Stack:** Next.js App Router, React client component, TypeScript, Tailwind CSS.

---

### Task 1: Calendar range picker UI

**Files:**
- Modify: `src/app/admin/dashboard-date-range.tsx`
- Modify: `src/app/admin/page.tsx`

- [x] **Step 1: Replace slider implementation**

Rewrite `DashboardDateRange` to render a button/summary and popover calendar instead of range sliders.

- [x] **Step 2: Move placement into hero header**

In `src/app/admin/page.tsx`, put `DashboardDateRange` in the right side of the top dashboard card header and remove the old bordered section below it.

- [x] **Step 3: Validate date behavior**

Ensure `Terapkan` updates URL with `from` and `to`, `Reset` returns to default 90-day range, selected date range is highlighted, and date order is normalized.

- [x] **Step 4: Validate app**

Run `npm run lint`, `npm test`, and `npm run build`. Manually verify `/admin` date picker opens, range selection works, URL updates, and dashboard card layout matches requested position.

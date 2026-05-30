# Dashboard Preset + Custom Date Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pair the dashboard date range with a preset dropdown (`Hari Ini`, `7 Hari`, `30 Hari`, `Bulan Ini`, `Bulan Lalu`, `Custom`) plus a calendar range button.

**Architecture:** Update the existing `DashboardDateRange` client component to expose a preset selector beside a calendar range button. Selecting a preset immediately updates the URL `from`/`to`. Selecting `Custom` (or clicking the range button) opens the existing calendar popover. Calendar `Terapkan` continues to set custom range and switches preset to `Custom`.

**Tech Stack:** Next.js App Router, React client component, TypeScript, Tailwind CSS.

---

### Task 1: Preset and range trigger UI

**Files:**
- Modify: `src/app/admin/dashboard-date-range.tsx`

- [x] **Step 1: Add preset detection and helpers**

Add helpers to compute preset ranges (`today`, `last7`, `last30`, `thisMonth`, `lastMonth`) and to detect which preset matches the current `from`/`to` so the dropdown can label as `Custom` when no preset matches.

- [x] **Step 2: Replace single trigger with preset + range trigger**

Render a select-style preset dropdown to the left and a calendar range button to the right. The range button shows formatted `dd Mmm yyyy - dd Mmm yyyy`.

- [x] **Step 3: Wire preset change**

Selecting a non-`Custom` preset immediately updates URL `from`/`to`. Selecting `Custom` opens the calendar popover. Clicking the range button always opens the calendar.

- [x] **Step 4: Apply custom range**

Calendar `Terapkan` keeps existing behavior, sets URL `from`/`to`, and the preset selector reflects `Custom`.

- [x] **Step 5: Validate**

Run `npm run lint`, `npm test`, and `npm run build`. Manually verify on `/admin?from=2026-05-01&to=2026-06-30` that each preset updates URL, `Custom` opens calendar, and the range button reflects the active range.

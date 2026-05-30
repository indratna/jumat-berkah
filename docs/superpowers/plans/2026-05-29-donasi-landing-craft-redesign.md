# Donasi Landing Craft Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `/donasi` to match the landing-page craft aesthetic without changing donation submit flow, payment redirect, validation behavior, donor prefill, or privacy/payment rules.

**Architecture:** Keep `src/app/donasi/page.tsx` as server page that resolves optional donor session, but wrap it in the same `landing-craft landing-noise` public shell used by `/`, `/tentang`, and `/laporan`. Keep `DonationForm` as client component with the same state model and `POST /api/donations` submit path. Re-skin layout, copy, controls, and helper panels using existing craft tokens from `globals.css`.

**Tech Stack:** Next.js App Router, React server/client components, TypeScript, Tailwind CSS.

---

## Constraints

- Do not change API routes, schema, payment, session, or validation logic.
- Keep `DonationForm` field set, field order, submit handler, request payload, and Midtrans redirect behavior.
- Keep donor login prefill from `src/app/donasi/page.tsx`.
- Keep anonymous-name behavior, public-name checkbox behavior, WhatsApp consent behavior, and result/error rendering logic.
- Use Indonesian copy.
- Keep page mobile-first and low-friction.

## Tasks

### Task 1: Wrap `/donasi` in public craft shell

**Files:**
- Modify: `src/app/donasi/page.tsx`

- [ ] **Step 1: Replace utilitarian page shell**

Replace `<main className="page-shell ...">` layout with `<div className="landing-craft landing-noise min-h-screen">` and craft `<main>` spacing consistent with `/tentang` and `/laporan`.

- [ ] **Step 2: Add public header**

Add the same public header family: brand link `JB`, nav links for `Beranda`, `Laporan`, `Tentang`, and active `Donasi` CTA.

### Task 2: Turn top section into landing-style split hero

**Files:**
- Modify: `src/app/donasi/page.tsx`

- [ ] **Step 1: Build editorial left column**

Replace flat info `panel` with craft hero content: pill `Donasi Jumat Berkah`, large headline, short reassurance paragraph, trust bullets for minimum donation, anonymity, and automatic payment status.

- [ ] **Step 2: Add quick transparency action**

Add secondary link/button to `/laporan` or `/laporan?period=jumat` so donation page still connects to public transparency story.

- [ ] **Step 3: Keep form visible above fold on desktop**

Use 2-column layout where left column is hero copy and right column is `DonationForm`, with desktop proportions similar to landing split sections.

### Task 3: Re-skin `DonationForm` without changing behavior

**Files:**
- Modify: `src/app/donasi/donation-form.tsx`

- [ ] **Step 1: Preserve logic, only change presentation**

Do not touch `handleSubmit`, fetch payload, redirect, or state structure except where required for className/copy wrappers.

- [ ] **Step 2: Apply craft card styling**

Change outer form container from `panel` to `craft-card-strong`/craft-friendly wrapper. Add small header badge like `Isi data singkat` and helper copy.

- [ ] **Step 3: Apply craft controls**

Restyle preset amount buttons, text inputs, textarea, checkbox containers, submit button, error text, donor-login notice, and success box to use cream/olive/amber tokens while keeping accessibility and existing states.

- [ ] **Step 4: Keep friction low**

Do not add steps, new sections, or extra confirmation UI. Form should still feel short and direct.

### Task 4: Add small reassurance strip below hero/form

**Files:**
- Modify: `src/app/donasi/page.tsx`

- [ ] **Step 1: Add micro-trust panel**

Add one small craft card/strip under the main grid with three short public-safe notes: privacy dijaga, kontak opsional, pembayaran QRIS diproses aman oleh Midtrans.

### Task 5: Validate and document

**Files:**
- Modify: `IMPLEMENTATION_PLAN.md`

- [ ] **Step 1: Run validation**

Run `npm run lint`, `npm test`, `npm run build`.

- [ ] **Step 2: Manual smoke**

Open `/donasi` and verify: donor-prefill still appears for logged-in donor, preset amount buttons still set amount, anonymous checkbox still disables public name flow correctly, submit still reaches payment redirect path, and no public copy exposes private donor data.

- [ ] **Step 3: Update tracker**

Add Work Log entry in `IMPLEMENTATION_PLAN.md` describing `/donasi` landing-style craft redesign and explicitly state payment/validation flow remained unchanged.

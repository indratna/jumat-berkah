# Admin Donor Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full admin donor management across two gated phases: CRM basics first, safe duplicate merge second.

**Architecture:** Add `DonorProfile` metadata separate from `Donation` so admin can manage operational donor data without mutating payment records. Phase 1 adds profile edit, notes, labels, CSV export, and audit logs. Phase 2 adds guarded merge with preview/confirmation and strict financial invariants.

**Tech Stack:** Next.js App Router, TypeScript, Prisma/PostgreSQL, Tailwind CSS, node:test.

---

## Gate Rule

Do **not** start Phase 2 until Phase 1 passes:

```bash
npm run lint
npm test
npm run build
```

Financial/payment fields must not change in either phase:

- `Donation.amount`
- `Donation.status`
- `Donation.orderId`
- `Donation.midtransTransactionId`
- webhook logic

---

## File Structure

### Create

- `src/lib/admin-donor-profile.ts` — validation, normalization, profile serialization, merge helpers.
- `src/app/api/admin/donors/[donorKey]/route.ts` — admin-only donor profile update endpoint.
- `src/app/api/admin/donors/export/route.ts` — admin-only filtered donor CSV export.
- `src/app/admin/donatur/donor-management-form.tsx` — client form for edit/contact/note/labels.
- `src/app/admin/donatur/donor-merge-form.tsx` — Phase 2 client merge form.
- `src/app/api/admin/donors/merge/route.ts` — Phase 2 admin-only merge endpoint.

### Modify

- `prisma/schema.prisma` — add `DonorProfile` model.
- `src/lib/admin.ts` — merge `DonorProfile` data into aggregated donor rows, add label filter.
- `src/app/admin/donatur/page.tsx` — add label filter, export button, management modal sections.
- `src/tests/business-rules.test.ts` — TDD for validation/normalization/merge invariants.
- `IMPLEMENTATION_PLAN.md` — Work Log after validation.

---

## Phase 1 — CRM Basics

### Task 1: Add donor profile validation with TDD

**Files:**
- Create: `src/lib/admin-donor-profile.ts`
- Modify: `src/tests/business-rules.test.ts`

- [ ] **Step 1: Write failing tests**

Add import:

```ts
import {
  normalizeDonorLabels,
  validateDonorProfilePayload,
} from "@/lib/admin-donor-profile";
```

Add tests:

```ts
test("donor profile validation accepts contact note and labels", () => {
  const result = validateDonorProfilePayload({
    displayName: "  Budi  ",
    email: " Budi@Example.Com ",
    phone: "0812-3456-7890",
    whatsappReminderOptIn: true,
    internalNote: " Donatur rutin Jumat pertama. ",
    labels: ["Rutin", " follow-up ", "rutin"],
  });

  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.data, {
      displayName: "Budi",
      email: "budi@example.com",
      phone: "081234567890",
      whatsappReminderOptIn: true,
      internalNote: "Donatur rutin Jumat pertama.",
      labels: ["Rutin", "follow-up"],
    });
  }
});

test("donor profile validation rejects consent without phone", () => {
  const result = validateDonorProfilePayload({
    displayName: "Budi",
    whatsappReminderOptIn: true,
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.errors.phone, "Nomor WhatsApp wajib untuk opt-in pengingat.");
  }
});

test("donor labels normalize and limit values", () => {
  assert.deepEqual(normalizeDonorLabels([" VIP ", "vip", "Rutin"]), [
    "VIP",
    "Rutin",
  ]);
});
```

- [ ] **Step 2: Verify red**

Run:

```bash
npm test -- src/tests/business-rules.test.ts
```

Expected: FAIL because `@/lib/admin-donor-profile` does not exist.

- [ ] **Step 3: Implement validator**

Create `src/lib/admin-donor-profile.ts` with:

```ts
export type DonorProfilePayload = {
  displayName?: unknown;
  email?: unknown;
  phone?: unknown;
  whatsappReminderOptIn?: unknown;
  internalNote?: unknown;
  labels?: unknown;
};

export type DonorProfileData = {
  displayName: string | null;
  email: string | null;
  phone: string | null;
  whatsappReminderOptIn: boolean;
  internalNote: string | null;
  labels: string[];
};

export type DonorProfileValidationResult =
  | { success: true; data: DonorProfileData }
  | { success: false; errors: Record<string, string> };

export function validateDonorProfilePayload(
  payload: DonorProfilePayload,
): DonorProfileValidationResult {
  const errors: Record<string, string> = {};
  const displayName = normalizeOptionalText(payload.displayName, 100);
  const email = normalizeEmail(payload.email);
  const phone = normalizePhone(payload.phone);
  const internalNote = normalizeOptionalText(payload.internalNote, 2_000);
  const labels = normalizeDonorLabels(Array.isArray(payload.labels) ? payload.labels : []);
  const whatsappReminderOptIn = payload.whatsappReminderOptIn === true;

  if (displayName === false) errors.displayName = "Nama maksimal 100 karakter.";
  if (email === false) errors.email = "Email tidak valid.";
  if (internalNote === false) errors.internalNote = "Catatan maksimal 2.000 karakter.";
  if (labels.length > 10) errors.labels = "Label maksimal 10.";
  if (whatsappReminderOptIn && !phone) {
    errors.phone = "Nomor WhatsApp wajib untuk opt-in pengingat.";
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };

  return {
    success: true,
    data: {
      displayName: displayName || null,
      email: email || null,
      phone: phone || null,
      whatsappReminderOptIn,
      internalNote: internalNote || null,
      labels: labels.slice(0, 10),
    },
  };
}

export function normalizeDonorLabels(values: unknown[]) {
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const label = value.trim().slice(0, 40);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }
  return labels;
}

function normalizeOptionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.length > maxLength) return false;
  return trimmed;
}

function normalizeEmail(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") return false;
  const email = value.trim().toLowerCase();
  if (!email) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : false;
}

function normalizePhone(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") return "";
  return value.replace(/[^0-9+]/g, "");
}
```

- [ ] **Step 4: Verify green**

Run:

```bash
npm test -- src/tests/business-rules.test.ts
```

Expected: PASS.

---

### Task 2: Add `DonorProfile` schema and migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add model**

Add to `prisma/schema.prisma`:

```prisma
model DonorProfile {
  id                     String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  donorKey               String    @unique @map("donor_key")
  userId                 String?   @map("user_id") @db.Uuid
  displayName            String?   @map("display_name")
  email                  String?
  phone                  String?
  whatsappReminderOptIn  Boolean   @default(false) @map("whatsapp_reminder_opt_in")
  whatsappReminderOptInAt DateTime? @map("whatsapp_reminder_opt_in_at")
  whatsappReminderOptOutAt DateTime? @map("whatsapp_reminder_opt_out_at")
  internalNote           String?   @map("internal_note")
  labels                 Json      @default("[]")
  mergedIntoId           String?   @map("merged_into_id") @db.Uuid
  createdAt              DateTime  @default(now()) @map("created_at")
  updatedAt              DateTime  @updatedAt @map("updated_at")

  user       User?         @relation(fields: [userId], references: [id], onDelete: SetNull)
  mergedInto DonorProfile? @relation("DonorProfileMerge", fields: [mergedIntoId], references: [id], onDelete: SetNull)
  mergedFrom DonorProfile[] @relation("DonorProfileMerge")

  @@index([userId])
  @@index([email])
  @@index([phone])
  @@index([mergedIntoId])
  @@map("donor_profiles")
}
```

Also add to `User` model:

```prisma
donorProfiles DonorProfile[]
```

- [ ] **Step 2: Create migration**

Run:

```bash
npx prisma migrate dev --name donor_profiles
npx prisma generate
```

Expected: migration created and Prisma client generated.

---

### Task 3: Merge profile metadata into admin donor list

**Files:**
- Modify: `src/lib/admin.ts`

- [ ] **Step 1: Extend types**

Add to `AdminDonor`:

```ts
profileId: string | null;
internalNote: string | null;
labels: string[];
mergedIntoId: string | null;
```

Add to `DonorFilterParams`:

```ts
label: string | null;
```

- [ ] **Step 2: Load donor profiles**

In `getAdminDonors`, include:

```ts
const donorProfiles = await prisma.donorProfile.findMany({
  where: { mergedIntoId: null },
});
```

Overlay profile values by `donorKey` after existing aggregation:

```ts
for (const profile of donorProfiles) {
  const current = donors.get(profile.donorKey);
  if (!current) continue;
  current.profileId = profile.id;
  current.name = profile.displayName ?? current.name;
  current.email = profile.email ?? current.email;
  current.phone = profile.phone ?? current.phone;
  current.whatsappReminderOptIn = profile.whatsappReminderOptIn;
  current.whatsappReminderOptInAt = profile.whatsappReminderOptInAt;
  current.whatsappReminderOptOutAt = profile.whatsappReminderOptOutAt;
  current.internalNote = profile.internalNote;
  current.labels = parseLabels(profile.labels);
  current.mergedIntoId = profile.mergedIntoId;
}
```

Add `parseLabels` helper.

- [ ] **Step 3: Add label filter**

Filter donor rows:

```ts
if (filters.label) {
  const labelKey = filters.label.toLowerCase();
  donorRows = donorRows.filter((donor) =>
    donor.labels.some((label) => label.toLowerCase() === labelKey),
  );
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test
```

Expected: PASS.

---

### Task 4: Add donor profile update API

**Files:**
- Create: `src/app/api/admin/donors/[donorKey]/route.ts`

- [ ] **Step 1: Implement admin-only PATCH**

Create route that:

- resolves admin via existing legacy or Better Auth admin guard pattern
- decodes `donorKey`
- validates payload with `validateDonorProfilePayload`
- upserts `donorProfile`
- writes audit log `donor.profile.updated`
- returns `{ ok: true }`

- [ ] **Step 2: Run validation**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected: PASS.

---

### Task 5: Add donor management UI and export

**Files:**
- Create: `src/app/admin/donatur/donor-management-form.tsx`
- Create: `src/app/api/admin/donors/export/route.ts`
- Modify: `src/app/admin/donatur/page.tsx`

- [ ] **Step 1: UI**

Add in donor detail modal:

- editable display name/email/phone
- WhatsApp consent checkbox
- internal note textarea
- labels comma input
- save button calls `PATCH /api/admin/donors/[donorKey]`

- [ ] **Step 2: Export**

Create admin-only export endpoint using `getAdminDonors(filters)` and return CSV with:

```txt
donor_key,nama,email,whatsapp,labels,catatan,consent_wa,total_settlement,jumlah_settlement,jumlah_donasi,donasi_pertama,donasi_terakhir
```

Write audit log `donor.exported`.

- [ ] **Step 3: Run Phase 1 validation**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected: PASS. Stop if failing.

- [ ] **Step 4: Commit Phase 1**

```bash
git add prisma/schema.prisma prisma/migrations src/lib/admin-donor-profile.ts src/lib/admin.ts src/app/api/admin/donors src/app/admin/donatur src/tests/business-rules.test.ts IMPLEMENTATION_PLAN.md
git commit -m "Add admin donor CRM tools"
```

---

## Phase 2 — Donor Merge

### Task 6: Add merge invariant tests

**Files:**
- Modify: `src/tests/business-rules.test.ts`
- Modify: `src/lib/admin-donor-profile.ts`

- [ ] **Step 1: Write failing tests**

Add tests:

```ts
test("donor merge validation requires distinct donors and confirmation", () => {
  assert.deepEqual(validateDonorMergePayload({
    primaryDonorKey: "email:a@example.com",
    duplicateDonorKey: "email:a@example.com",
    confirmation: "GABUNG DONATUR",
  }), {
    success: false,
    errors: { duplicateDonorKey: "Donatur duplikat harus berbeda dari donatur utama." },
  });

  assert.deepEqual(validateDonorMergePayload({
    primaryDonorKey: "email:a@example.com",
    duplicateDonorKey: "phone:0812",
    confirmation: "gabung",
  }), {
    success: false,
    errors: { confirmation: "Ketik GABUNG DONATUR untuk konfirmasi." },
  });
});
```

- [ ] **Step 2: Verify red**

Run:

```bash
npm test -- src/tests/business-rules.test.ts
```

Expected: FAIL because `validateDonorMergePayload` is missing.

- [ ] **Step 3: Implement merge validation**

Add to `src/lib/admin-donor-profile.ts`:

```ts
export function validateDonorMergePayload(payload: {
  primaryDonorKey?: unknown;
  duplicateDonorKey?: unknown;
  confirmation?: unknown;
}) {
  const errors: Record<string, string> = {};
  const primaryDonorKey = typeof payload.primaryDonorKey === "string" ? payload.primaryDonorKey.trim() : "";
  const duplicateDonorKey = typeof payload.duplicateDonorKey === "string" ? payload.duplicateDonorKey.trim() : "";
  const confirmation = typeof payload.confirmation === "string" ? payload.confirmation.trim() : "";

  if (!primaryDonorKey) errors.primaryDonorKey = "Donatur utama wajib dipilih.";
  if (!duplicateDonorKey) errors.duplicateDonorKey = "Donatur duplikat wajib dipilih.";
  if (primaryDonorKey && duplicateDonorKey && primaryDonorKey === duplicateDonorKey) {
    errors.duplicateDonorKey = "Donatur duplikat harus berbeda dari donatur utama.";
  }
  if (confirmation !== "GABUNG DONATUR") {
    errors.confirmation = "Ketik GABUNG DONATUR untuk konfirmasi.";
  }

  if (Object.keys(errors).length > 0) return { success: false as const, errors };
  return { success: true as const, data: { primaryDonorKey, duplicateDonorKey } };
}
```

- [ ] **Step 4: Verify green**

Run:

```bash
npm test -- src/tests/business-rules.test.ts
```

Expected: PASS.

---

### Task 7: Add merge API and UI

**Files:**
- Create: `src/app/api/admin/donors/merge/route.ts`
- Create: `src/app/admin/donatur/donor-merge-form.tsx`
- Modify: `src/app/admin/donatur/page.tsx`

- [ ] **Step 1: API behavior**

Create admin-only merge endpoint that:

- validates payload with `validateDonorMergePayload`
- ensures both donor profiles exist or creates profile shells for their donor keys
- marks duplicate `mergedIntoId = primary.id`
- merges labels into primary, deduped
- appends duplicate note to primary note under `Catatan dari donor gabungan:` marker
- does **not** update `donations.amount/status/orderId/midtransTransactionId`
- writes audit log `donor.merged`

- [ ] **Step 2: UI behavior**

Add merge form in donor detail:

- primary donor is current selected donor
- duplicate donor key input/search field
- confirmation field requiring `GABUNG DONATUR`
- submit button calls `/api/admin/donors/merge`
- success refreshes page

- [ ] **Step 3: Run Phase 2 validation**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit Phase 2**

```bash
git add src/lib/admin-donor-profile.ts src/app/api/admin/donors/merge src/app/admin/donatur src/tests/business-rules.test.ts IMPLEMENTATION_PLAN.md
git commit -m "Add safe donor merge workflow"
```

---

## Final Manual Smoke

Verify:

- `/admin/donatur` loads.
- admin edits donor profile.
- note and labels persist.
- label filter works.
- donor export downloads CSV.
- merge form requires confirmation.
- merge hides duplicate active profile.
- public `/laporan` still hides donor email/phone.
- donation totals unchanged before/after merge.

## Final Validation

Run:

```bash
npm run lint
npm test
npm run build
```

Expected: all PASS.

## Self-Review

- Spec coverage: Phase 1 CRM basics and Phase 2 merge covered.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: payload/helper names match planned routes.
- Scope check: payment/webhook/status/amount changes are explicitly forbidden.
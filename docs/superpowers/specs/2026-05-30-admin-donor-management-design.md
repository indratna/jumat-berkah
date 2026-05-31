# Admin Donor Management Design

Date: 2026-05-30  
Status: Approved design

## Goal

Turn `/admin/donatur` from read/search database into safe donor-management tooling for admin, without changing payment status, donation amount, Midtrans data, public privacy rules, or donor-facing auth flow.

## Scope Split

Implement in two phases.

### Phase 1 — Donor CRM Basics

Build safe management features first:

- edit donor operational contact profile
- internal admin notes
- donor labels/tags
- filtered donor CSV export
- audit logs for every admin write/export

### Phase 2 — Donor Merge

Add duplicate merge only after Phase 1 is validated:

- choose primary donor and duplicate donor
- preview affected identity/contact/donation records
- require explicit confirmation text
- create full audit log
- never mutate donation financial/payment fields

## Current State

Existing `/admin/donatur` aggregates donor records from:

- registered `users.role = donor`
- guest donations via donor email/phone/name

Existing admin donor page supports:

- search by name/email/phone
- activity filter
- sorting
- pagination
- donor detail modal
- WhatsApp consent display
- links to matching donation history

Existing limitation:

- no durable donor profile metadata for guest donor contacts
- no admin notes/labels
- no edit/update flow
- no donor export route
- no merge flow

## Data Model Direction

Add admin-managed donor profile metadata separate from donation payment records.

### New `DonorProfile` model

Purpose: stable admin-only metadata for a donor identity key.

Suggested fields:

| Field | Type | Notes |
|---|---|---|
| id | UUID | primary key |
| donorKey | string | unique key matching existing aggregation key (`user:...`, `email:...`, `phone:...`, `name:...`) |
| userId | UUID nullable | linked registered donor if applicable |
| displayName | string nullable | admin-edited operational name |
| email | string nullable | admin-edited operational email |
| phone | string nullable | admin-edited operational WhatsApp |
| whatsappReminderOptIn | boolean | admin-managed opt-in state |
| whatsappReminderOptInAt | DateTime nullable | set when opt-in becomes true |
| whatsappReminderOptOutAt | DateTime nullable | set when opt-in becomes false |
| internalNote | text nullable | admin-only note |
| labels | jsonb/string[] | admin labels |
| mergedIntoId | UUID nullable | Phase 2 merge reference |
| createdAt | DateTime | audit/admin metadata |
| updatedAt | DateTime | audit/admin metadata |

Rules:

- Do not store donor notes/labels on `Donation`.
- Do not expose this model to public report.
- Existing donation contact fields remain historical submitted values.
- Donor profile overrides are admin-operational only.

## Phase 1 Behavior

### Edit contact profile

Admin can edit:

- display name
- email
- WhatsApp number
- WhatsApp reminder consent

Validation:

- name max 100 chars
- email optional, valid if present
- phone optional, normalize safe Indonesian WhatsApp style if possible
- cannot enable WhatsApp consent without phone
- consent timestamp updates only on state transition

### Notes

Admin can save one internal note per donor profile.

Rules:

- max length e.g. 2,000 chars
- admin-only
- never in public report/export except admin donor export
- audit before/after

### Labels

Admin can apply multiple labels.

MVP label behavior:

- free text labels, comma-separated in form
- trim whitespace
- max 10 labels
- each label max 40 chars
- dedupe case-insensitively

Filter:

- `/admin/donatur?label=...` filters donor profiles containing label

### Export CSV

Admin can export current filtered donor list.

Endpoint:

```txt
GET /api/admin/donors/export?q=&activity=&label=&sort=&direction=
```

CSV includes admin-only operational fields:

- donor key
- name
- email
- WhatsApp
- labels
- note
- consent status
- total settlement amount
- settlement count
- donation count
- first donation date
- last donation date

Security:

- admin-only guard
- CSV response no cache
- audit action `donor.exported`

## Phase 2 Behavior — Merge Donor

### Merge flow

Admin opens donor detail and clicks `Gabungkan Duplikat`.

Flow:

1. choose primary donor
2. search/select duplicate donor
3. preview merge impact
4. type confirmation phrase `GABUNG DONATUR`
5. submit merge

Preview must show:

- primary donor key/profile
- duplicate donor key/profile
- email/phone/name values
- settlement amount/count for both
- donation order IDs affected
- labels/notes merge result

### Merge write rules

Allowed:

- set duplicate `DonorProfile.mergedIntoId = primary.id`
- move labels from duplicate to primary, deduped
- append duplicate note into primary note with timestamp marker
- optionally update donation `userId` only when both records are safely linked to same verified email/user identity

Forbidden:

- change `Donation.amount`
- change `Donation.status`
- change `Donation.orderId`
- change Midtrans transaction fields
- delete donation records
- count settlement twice

Audit:

- action `donor.merged`
- entity type `donor_profile`
- entity id primary profile id
- before/after include donor keys, affected donation IDs, labels, notes summary, contact values

## UI Design

### `/admin/donatur` table

Add columns/areas:

- labels summary
- note indicator
- management action button `Kelola`

Toolbar additions:

- label filter
- export CSV button

### Donor detail modal

Add management sections:

1. `Profil operasional`
   - editable contact fields
   - consent control
2. `Catatan internal`
   - textarea
3. `Label donatur`
   - comma-separated input/chips
4. `Riwayat donasi`
   - current order ID links remain
5. `Duplikat`
   - Phase 2 merge entrypoint

## API Design

### Phase 1 endpoints

```txt
PATCH /api/admin/donors/[donorKey]
GET /api/admin/donors/export
```

`PATCH` payload:

```json
{
  "displayName": "Budi",
  "email": "budi@example.com",
  "phone": "08123456789",
  "whatsappReminderOptIn": true,
  "internalNote": "Sering donasi Jumat pertama.",
  "labels": ["Donatur rutin", "Follow-up"]
}
```

### Phase 2 endpoint

```txt
POST /api/admin/donors/merge
```

Payload:

```json
{
  "primaryDonorKey": "email:budi@example.com",
  "duplicateDonorKey": "phone:08123456789",
  "confirmation": "GABUNG DONATUR"
}
```

## Privacy and Security

- Admin-only pages/API only.
- Public report must never show donor email/phone/internal notes/labels unless future spec explicitly approves public labels.
- Export contains private operational data, admin-only.
- All writes audited.
- Merge is irreversible in UI; require explicit confirmation.

## Financial Safety

- No payment/webhook changes.
- No donation amount/status changes.
- Settlement totals remain derived from successful donations only.
- Merge must not create/delete donations.
- Duplicate webhooks remain unaffected.

## Testing

### Phase 1 tests

- donor profile validation accepts valid contact/note/labels
- rejects invalid email/too-long note/too many labels
- rejects WhatsApp opt-in without phone
- label normalization dedupes values
- export CSV includes contact fields and totals
- public report still hides private donor fields

### Phase 2 tests

- merge confirmation phrase required
- cannot merge donor into itself
- merge preview preserves amount/status/order ID
- labels dedupe on merge
- merged donor no longer appears as separate active profile
- settlement totals unchanged after merge

## Validation

For each phase:

```txt
npm run lint
npm test
npm run build
```

Manual smoke:

- admin can edit donor profile
- labels/notes persist
- filters work
- export downloads filtered CSV
- merge preview shows affected records
- merge requires confirmation
- public report privacy unchanged

## Acceptance Criteria

Phase 1 done when:

- admin can edit donor operational contact data
- admin can save notes and labels
- donor list filters by label
- admin can export donor CSV
- all writes/export create audit logs
- validation passes

Phase 2 done when:

- admin can merge duplicate donor profiles safely
- confirmation and preview protect accidental merge
- financial/payment fields remain unchanged
- audit log stores before/after merge data
- validation passes

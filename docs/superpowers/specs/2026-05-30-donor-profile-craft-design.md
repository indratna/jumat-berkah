# Donor Profile Craft Redesign Design

Date: 2026-05-30
Status: Approved design

## Goal

Redesign `/akun/profil` so it feels like part of the donor craft experience, not a generic settings page. The page should stay focused on account identity and security, but visually match `/donasi`, `/masuk`, `/daftar`, and the new donor dashboard.

## Tone

Use warm personal copy with a calm, secure feeling.

Hero direction:

```txt
Assalamu’alaikum, {nama}
Kelola identitas akun Anda dengan aman agar pengalaman donasi tetap rapi dan nyaman.
```

## Scope

In scope:

- Redesign `/akun/profil` with craft visual language.
- Add craft header with donor navigation.
- Add personal hero section.
- Keep 3 content blocks:
  1. Ringkasan akun
  2. Edit profil
  3. Keamanan akun
- Show existing profile image when available.
- Use initials fallback with stronger craft presentation when image is not available.
- Keep current profile update and password change behavior.

Out of scope:

- Avatar upload/change.
- Email change flow.
- Auth flow changes.
- Database schema changes.
- Admin profile redesign in this pass.

## User Experience

### Header

Use the same craft shell pattern as donor-facing pages.

Actions:

- Brand link: `JB Jumat Berkah Karyo`.
- `Kembali ke Dashboard` -> `/akun/donasi`.
- `Donasi Lagi` -> `/donasi`.

### Hero

Show personal greeting and short reassurance copy.

Content:

- `Assalamu’alaikum, {nama}`.
- Short explanation that this page is for safe account/profile management.

### Block 1 — Ringkasan akun

Show a compact overview card with:

- Profile image if available.
- Craft initials fallback if image is missing.
- Display name.
- Email.
- Role label `Donatur`.

This block is read-oriented, not editable.

### Block 2 — Edit profil

Keep current profile form behavior:

- Editable display name only.
- Email remains read-only and explained with helper text.
- Existing save success/error messages remain.

### Block 3 — Keamanan akun

Keep current password change behavior:

- Current password.
- New password.
- Confirm new password.
- Existing success/error handling.

Add supporting copy:

- Explain that changing password revokes other sessions.

## Visual Direction

- Wrapper uses `landing-craft landing-noise`.
- Hero and summary use `craft-card-strong`.
- Form sections use `craft-card`.
- Typography and spacing follow donor dashboard rhythm.
- Avatar fallback should feel more personal than the current plain square, but still simple.
- Use cream / olive / amber craft tokens.

## Data and Security

- Keep existing `getCurrentAccountProfile()` server flow.
- If not authenticated, redirect to `/masuk`.
- Role label stays server-derived.
- Email is visible only to account owner on their own page.
- No donor phone appears.

## Error and Fallback States

- Unauthenticated user redirects to `/masuk`.
- Missing name falls back to email/initials.
- Missing image falls back to initials-based craft avatar.

## Testing and Validation

Automated validation:

```txt
npm run lint
npm test
npm run build
```

Manual smoke:

- Logged-in donor opens `/akun/profil`.
- Header actions navigate correctly.
- Profile image or initials render correctly.
- Update display name still works.
- Change password form still works.
- Anonymous visitor redirects to `/masuk`.

## Acceptance Criteria

- `/akun/profil` visually matches donor craft pages.
- Header includes `Kembali ke Dashboard` and `Donasi Lagi`.
- Hero feels personal and warm.
- Page uses 3 blocks: ringkasan akun, edit profil, keamanan akun.
- Existing update profile behavior still works.
- Existing password change behavior still works.
- No auth/schema/backend behavior changes beyond UI composition.

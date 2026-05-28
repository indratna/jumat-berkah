# InApp-Inspired UI Refresh Design — Jumat Berkah Karyo

Date: 2026-05-28
Status: Draft for review
Scope: Frontend UI/UX only
Reference: `D:\inapp-1.0.0`

## Goal

Improve Jumat Berkah Karyo visual quality by adapting the InApp admin dashboard style into the existing Next.js/Tailwind application without changing backend logic, auth, Midtrans, database, APIs, routes, or business rules.

The target look is:

- Public pages: warm nonprofit, trustworthy, simple.
- Admin pages: neutral office dashboard, data-first, compact, accurate.
- Overall: consistent spacing, calmer cards, clearer navigation, readable tables/forms, accessible interactions.

## Reference Findings

The InApp template provides these useful visual patterns:

- Fixed admin sidebar around 240px on desktop.
- 60px topbar with simple icon buttons.
- White surfaces on a neutral gray background.
- Thin gray borders and light elevation.
- Compact nav links with 8px radius.
- Active nav state using tinted background plus primary color.
- Dashboard metric cards with icon block, label, value, and supporting text.
- Bootstrap-like spacing scale: 4, 8, 16, 24, 32, 40, 48px.
- Poppins typography at compact dashboard scale.
- Data tables with clear headers, separators, and modest density.

The template should not be copied directly because:

- It is Bootstrap/Sass/Vite, while Jumat Berkah uses Next.js App Router and Tailwind CSS.
- It is an inventory template, so product copy and data model do not fit.
- Its orange primary (`#E66239`) does not fit Jumat Berkah as the main brand color.
- Dummy avatar, notification, product image, and inventory UI should not be imported.

## Design Direction

### Public Pages

Use a warm nonprofit direction:

- Background: `slate-50` / soft neutral.
- Surface: white cards with `slate-200` borders.
- Primary action: green, not orange.
- Accent: amber/cream used sparingly for warmth and trust.
- Typography: readable, modest headings, no oversized marketing hero.
- Content priority: purpose, donation CTA, public transparency, current totals.

Target pages:

- `/`
- `/donasi`
- `/laporan`
- `/login`
- `/masuk` if present in current routes

### Admin Pages

Use InApp-inspired office dashboard direction:

- Sidebar: fixed desktop layout, simple grouped navigation, clean active state.
- Topbar/header: compact page title, optional action area, no decorative hero.
- Cards: white surface, thin border, 12–16px radius, small shadow or no shadow.
- Tables: clear header row, comfortable row height, tabular Rupiah numbers.
- Forms: visible labels, helper/error text near fields, 44px+ control height.
- Badges: consistent status color mapping with text labels.
- Data density: compact enough for operations, not cramped on mobile.

Target pages:

- `/admin`
- `/admin/donasi`
- `/admin/pengeluaran`
- `/admin/donatur`
- `/admin/penyaluran`
- `/admin/audit`
- `/admin/persetujuan` if present

### Account Pages

Use the same neutral system as public pages, with simpler panels:

- `/akun/donasi`
- `/akun/profil`
- `/reset-password`
- `/lupa-password`
- donation status pages

## Visual Tokens

### Color

Use semantic Tailwind classes rather than hardcoded per-component hex values.

Recommended mapping:

- App background: `bg-slate-50`
- Surface: `bg-white`
- Border: `border-slate-200`
- Primary text: `text-slate-950`
- Secondary text: `text-slate-600`
- Muted text: `text-slate-500`
- Primary action: `bg-green-700`, hover `bg-green-800`
- Primary soft: `bg-green-50`, `text-green-700`, `border-green-200`
- Warm accent: `bg-amber-50`, `text-amber-800`, `border-amber-200`
- Danger: `red` semantic classes
- Warning/pending: `amber` semantic classes
- Success/settlement: `green` semantic classes

Avoid:

- Full-screen green gradients.
- Decorative glow/radial backgrounds.
- Gray-on-gray text with poor contrast.
- Orange as primary brand color, except if used as tiny warm accent.

### Typography

Use current app font stack unless existing project already uses another approved font. Do not add network font dependency unless necessary.

Scale:

- Body: 16px public, 14–16px admin depending component.
- Page title: 24–32px admin, 32–44px public landing.
- Card title: 14–18px.
- Table text: 14px.
- Labels/help text: 12–14px.

Weight:

- Headings: 650–750 equivalent Tailwind weights.
- Body: 400.
- Labels/buttons: 500–700.

Avoid:

- `font-black` for normal admin headings.
- Very large landing-style headings inside admin.
- Body text below 14px.

### Radius, Border, Shadow

Use consistent scale:

- Buttons/input/nav: `rounded-lg` or `rounded-xl`.
- Cards/panels: `rounded-2xl` where space allows, `rounded-xl` in dense tables.
- Borders: `border border-slate-200`.
- Shadow: minimal, usually `shadow-sm`; prefer border over heavy shadow.

Avoid:

- Random radius scale.
- Heavy shadows.
- Glassmorphism/blur surfaces.

### Spacing

Use 4/8px rhythm:

- Inner control padding: 8–14px.
- Card padding: 16–24px.
- Section gap: 24–40px.
- Admin page gutters: 16px mobile, 24–32px desktop.
- Public page max width: consistent centered container.

## Component Rules

### Admin Sidebar

Adapt InApp behavior conceptually:

- Desktop width around 240px.
- Mobile sidebar/drawer should not block content without clear close affordance.
- Group labels: `Utama`, `Operasional`, `Laporan`, `Sistem`.
- Active nav: soft green/slate tint plus stronger text.
- Each nav item must have text label; avoid icon-only nav.
- Logout/danger actions should be visually separated.

### Topbar / Page Header

- Use a compact page header, not a decorative hero.
- Include title, short description, and main action where relevant.
- On mobile, stack title and actions.
- Avoid notification/avatar dummy UI unless backed by real app behavior.

### Cards

- Metric cards follow InApp pattern: label, value, optional supporting text, optional icon tile.
- Use tabular numbers for Rupiah and counts.
- Put data hierarchy first, icon second.
- Avoid overly colorful cards; use tint only for semantic emphasis.

### Tables

- Header row `bg-slate-50`, text `text-slate-500/600`.
- Row borders `border-slate-200`.
- Amount columns use `tabular-nums` and clear alignment.
- Mobile: horizontal scroll only for dense tables; no whole-page horizontal overflow.
- Empty state appears inside table/card, not blank space.

### Forms

- Visible labels for all fields.
- Error message near field.
- Helper text for privacy/payment/consent context.
- Inputs min height 44px.
- Submit buttons show loading state where existing logic supports it.
- Donation flow remains short and low friction.

### Buttons

- Primary: green filled.
- Secondary: white/slate outline.
- Destructive: red, visually separated.
- Icon buttons: 40–44px target, accessible labels.
- Hover/focus states must be visible.

### Status Badges

Use consistent mapping:

- `settlement`: green success.
- `pending`: amber warning.
- `expire`, `cancel`, `deny`, `failure`: red/slate depending severity.
- `refund`: slate/blue if currently used.

Color must not be the only indicator; badge text remains visible.

## Accessibility Requirements

Must preserve or improve:

- Contrast at least 4.5:1 for normal text.
- Visible focus rings on links, buttons, inputs, and nav items.
- Touch/click target at least 44px for important actions.
- Keyboard navigation order follows visual order.
- Forms use labels, not placeholder-only labels.
- Public report never exposes donor email or phone.
- Anonymous donor remains `Anonim`.

## Responsive Requirements

Breakpoints to review:

- 375px mobile.
- 768px tablet.
- 1024px desktop.
- 1440px wide desktop.

Rules:

- Mobile-first layout.
- No horizontal scroll except table containers.
- Admin sidebar adapts for small screens.
- Fixed/sticky UI must not cover content.
- Public content line length remains readable.

## Implementation Boundaries

Allowed changes:

- UI component markup/classes.
- `src/app/globals.css` visual tokens/utilities.
- Shared frontend components.
- Page-level Tailwind styling.
- Loading/empty/error UI styling when already present or needed for data pages.
- `IMPLEMENTATION_PLAN.md` progress/work log after validation.

Disallowed changes:

- Database schema.
- Prisma models/migrations.
- Payment/Midtrans logic.
- Webhook behavior.
- Auth/session logic.
- API contracts.
- Financial calculations.
- Report privacy rules.
- Routes or business flows.

## Proposed Implementation Order

1. Global visual foundation
   - Refine background, typography, focus, form/table defaults if applicable.
   - Remove leftover overly promotional styling.

2. Shared admin shell/components
   - Sidebar, page header, summary cards, status badges, tables/buttons/forms.

3. Admin dashboard and admin data pages
   - Apply InApp-inspired office dashboard layout and density.

4. Public pages
   - Apply warm nonprofit direction to landing, donation, and report pages.

5. Account/auth/status pages
   - Normalize panels, forms, empty/loading/error states.

6. Validation and documentation
   - Run lint, tests, build.
   - Update `IMPLEMENTATION_PLAN.md` Work Log.

## Validation Plan

Automated validation:

- `npm run lint`
- `npm test`
- `npm run build`

Manual visual review:

- `/`
- `/donasi`
- `/laporan`
- `/login`
- `/masuk` if route exists
- `/admin`
- `/admin/donasi`
- `/admin/pengeluaran`
- `/admin/donatur`
- `/admin/penyaluran`
- `/admin/audit`
- `/akun/donasi`
- `/akun/profil`

Manual checks:

- Admin sidebar readable and reachable.
- Tables readable on desktop and usable on mobile.
- Forms have visible labels and error placement.
- Buttons and links have visible focus states.
- Public report still hides donor contact fields.
- Donation flow remains short.
- No promotional dark hero overload.

## Open Decision

Before implementation, confirm whether admin pages should adopt InApp-style compactness strongly or moderately.

Recommended choice: moderate compactness. It keeps the app operational and professional without becoming cramped for non-technical admins.

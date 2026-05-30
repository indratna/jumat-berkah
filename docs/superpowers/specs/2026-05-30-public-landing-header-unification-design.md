# Public Landing Header Unification Design

Date: 2026-05-30  
Status: Approved

## Goal

Samakan header/nav atas untuk public landing-family pages agar semua memakai struktur, copy, dan CTA yang konsisten, plus animasi perpindahan active nav berbentuk pill.

## Pages In Scope

- `/`
- `/tentang`
- `/laporan`
- `/donasi`

## Out of Scope

- `/akun/*`
- `/admin/*`
- `/masuk`
- `/daftar`
- `/cek-email`
- `/donasi/status/[orderId]`
- perubahan body/hero/content utama masing-masing page

## Source of Truth

Gunakan model header `/donasi` sebagai basis shared header.

## Header Content

### Brand

- `JB Jumat Berkah Karyo` -> `/`

### Navigation Links

- `Laporan` -> `/laporan`
- `Tentang` -> `/tentang`

### Primary CTA

- `Donasi Sekarang` -> `/donasi`

## Visual Behavior

- Header landing-family pages harus identik pada struktur, urutan, spacing, dan styling utama.
- Active nav memakai rounded pill.
- Active pill berpindah halus saat user berpindah page.
- Hover state tetap ada, tapi lebih lembut daripada state aktif.
- CTA `Donasi Sekarang` tetap paling menonjol.

## Animation Direction

### Active Pill

Gunakan animasi ringan berbasis CSS untuk:

- background-color
- text color
- shadow/ring
- transform kecil bila dibutuhkan

Target feel:

- durasi `200–300ms`
- easing `ease-out`
- tanpa motion library
- tanpa layout jump

### Responsive Behavior

- Ikuti pola responsif header `/donasi` saat ini.
- Desktop menampilkan brand, nav links, dan CTA.
- Mobile tetap stabil dan tidak menambah interaksi kompleks baru.

## Architecture

Tambahkan shared public header component, misalnya:

- `src/components/landing/public-header.tsx`

Komponen ini menjadi source of truth untuk header landing-family pages.

### Suggested split

- server-safe outer header markup
- small client child/helper untuk active pathname matching bila dibutuhkan

## Behavior Rules

- `/` tidak perlu active pill untuk brand; active state hanya untuk `Laporan` dan `Tentang`.
- `/donasi` diperlakukan sebagai CTA aktif visual, bukan nav link aktif biasa.
- `Laporan` aktif hanya di `/laporan`.
- `Tentang` aktif hanya di `/tentang`.
- Tidak ada perubahan route atau copy di luar header.

## Testing

Lakukan TDD untuk helper/config active matching bila helper baru dibuat.

Minimal coverage:

- pathname `/laporan` -> active `Laporan`
- pathname `/tentang` -> active `Tentang`
- pathname `/` -> no active secondary nav
- pathname `/donasi` -> CTA tetap render benar

## Validation

Run:

- `npm run lint`
- `npm test`
- `npm run build`

Manual smoke:

- `/`, `/tentang`, `/laporan`, `/donasi` pakai header sama
- active pill muncul benar di `/laporan` dan `/tentang`
- CTA `Donasi Sekarang` konsisten di semua page
- mobile header tetap rapi

## Acceptance Criteria

- Semua public landing-family pages memakai header yang sama.
- Header memakai copy dan urutan link yang konsisten.
- `Laporan` dan `Tentang` punya active-pill animated state.
- `Donasi Sekarang` konsisten sebagai CTA utama.
- Tidak ada perubahan pada auth, payment, webhook, schema, atau konten body page.

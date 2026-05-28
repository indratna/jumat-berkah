# Reporting Export Upgrade

## Export yang tersedia

- PDF publik siklus Jumat: `/api/reports/public/export?format=pdf`
- CSV publik siklus Jumat: `/api/reports/public/export?format=csv`
- CSV admin dengan filter tanggal tetap tersedia di `/api/admin/reports/export`

## Keputusan Excel

Excel native belum ditambahkan pada Phase 30 karena dependency baru belum disetujui. Untuk kebutuhan arsip operasional saat ini, CSV tetap dipakai karena bisa dibuka di Excel/LibreOffice tanpa menambah paket runtime.

Jika dependency disetujui nanti, kandidat paket: `exceljs` atau `xlsx`. Evaluasi harus mencakup ukuran bundle, maintenance, dan keamanan supply chain.

## Aturan privasi

Export publik memakai kalkulasi `getPublicReport` dan nama donor publik. Email dan nomor WhatsApp donor tidak ikut query maupun output.

Receipt donasi hanya menampilkan order ID, nominal, status, dan nama publik donor. Receipt tidak menampilkan email/nomor WhatsApp dan tidak membuka data donor lain.

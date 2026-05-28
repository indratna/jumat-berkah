# Features — Jumat Berkah

Panduan ringkas fitur aplikasi untuk maintainer baru. Semua fitur wajib mengikuti aturan privasi: laporan publik tidak menampilkan email atau nomor WhatsApp donatur, dan donatur anonim tampil sebagai `Anonim`.

## Publik

### Landing page

- Route: `/`
- Menjelaskan program Jumat Berkah, ringkasan dana, dan CTA ke donasi/laporan.
- Smoke test: buka `/`, klik `Donasi Sekarang`, klik `Lihat Laporan`.

### Donasi publik

- Route: `/donasi`
- Donatur tidak wajib login.
- Field: nama, anonim, email opsional, WhatsApp opsional, nominal, pesan/doa, tampilkan nama publik, consent WhatsApp reminder.
- Nominal disimpan sebagai integer Rupiah.
- Status awal donasi: `pending`.
- Smoke test: buat donasi sandbox, pastikan halaman status terbuka dan status awal pending.

### Pembayaran Midtrans QRIS

- Server membuat transaksi Midtrans.
- Client hanya menerima token/redirect URL aman.
- Webhook Midtrans menjadi sumber kebenaran status pembayaran.
- Status sukses internal: `settlement`.
- Smoke test: bayar QRIS sandbox, pastikan webhook masuk, status donasi berubah ke `settlement`, dan laporan publik bertambah.

### Status donasi

- Route: `/donasi/status/[orderId]`
- Menampilkan status pending/sukses/gagal secara aman.
- Receipt/share badge hanya memakai data publik aman.
- Smoke test: buka order pending dan settlement.

### Laporan publik

- Route: `/laporan`
- Menampilkan pemasukan, pengeluaran, saldo periode, saldo berjalan, donasi berhasil, pengeluaran, kategori pengeluaran, timeline transparansi, target Jumat, dan cerita penyaluran bila tersedia.
- Filter periode dan shortcut siklus Jumat tersedia.
- Print A4 dan export PDF/CSV tersedia.
- Smoke test: buka `/laporan?period=jumat`, cek total, cetak preview, export PDF/CSV, pastikan email/phone tidak muncul.

### Tentang program

- Route: `/tentang`
- Menjelaskan tujuan program, jadwal Jumat, transparansi, privasi, dan kontak.
- Smoke test: buka `/tentang` dari browser publik.

## Donatur login opsional

### Login donor

- Route: `/masuk`
- Mendukung Better Auth Google/email-password dan legacy code login.
- Login opsional, bukan syarat donasi.
- Smoke test: login donor, buka riwayat donasi.

### Riwayat donasi donor

- Route: `/akun/donasi`
- Menampilkan donasi milik donor login.
- Admin role tidak otomatis mendapat akses donor.
- Smoke test: donor login melihat riwayat sendiri saja.

### Profil akun

- Route: `/akun/profil`
- Update nama profil, ganti password, dan entrypoint reset password.
- Perubahan penting menulis audit log.
- Smoke test: update nama profil dan ganti password.

### Reset password

- Routes: `/lupa-password`, `/reset-password`
- Better Auth mengirim email reset melalui Resend bila aktif; lokal development mencetak URL reset ke log bila email nonaktif/gagal.
- Smoke test: minta reset, buka URL reset, login pakai password baru.

## Admin

### Login admin

- Route: `/login`
- Mendukung Better Auth Google/email-password dan legacy admin code.
- Akses admin tetap harus cocok dengan role `admin` di domain table `users`.
- Smoke test: login admin, buka `/admin`; donor/guest harus ditolak.

### Dashboard admin

- Route: `/admin`
- Ringkasan donasi, pengeluaran, saldo, target mingguan, dan shortcut operasional.
- Smoke test: buka dashboard setelah login admin.

### Manajemen donasi

- Route: `/admin/donasi`
- Filter dan inspeksi status donasi.
- Admin dapat melihat contact field operasional; publik tidak.
- Smoke test: cari donasi settlement/pending.

### Database donatur

- Route: `/admin/donatur`
- Menggabungkan donor login dan donor tamu dari data donasi.
- Filter nama/email/phone, status aktif, consent WhatsApp.
- Smoke test: cari donor dan pastikan total settlement tidak memasukkan pending/gagal.

### Manajemen pengeluaran

- Route: `/admin/pengeluaran`
- Create/edit/delete pengeluaran, template cepat, import CSV preview/all-or-nothing.
- Semua perubahan finansial menulis audit log.
- Smoke test: buat pengeluaran, edit, delete, import CSV sample, cek audit dan laporan publik.

### Persetujuan pengeluaran besar

- Route: `/admin/persetujuan`
- Monitoring read-only untuk pengeluaran besar yang butuh approval Telegram.
- Smoke test: buat pengeluaran di atas threshold dan cek halaman monitoring.

### Audit admin

- Route: `/admin/audit`
- Filter action/entity/actor/date, expandable before/after.
- Smoke test: buat expense, cek audit log muncul.

### Cerita penyaluran

- Route: `/admin/penyaluran`
- Admin membuat draft/publish cerita penyaluran per siklus Jumat, termasuk foto URL publik, jumlah paket, dan lokasi ringkas.
- Public report hanya menampilkan cerita `published`.
- Smoke test: publish cerita, cek `/laporan?period=jumat`.

### Target mingguan

- Route: `/admin`
- Admin mengatur target donasi untuk siklus Jumat berjalan.
- Progress dihitung dari donasi `settlement` saja.
- Smoke test: set target, cek card di admin dan publik.

## Integrasi

### Midtrans

- Membuat transaksi QRIS dan menerima webhook status.
- Signature diverifikasi memakai `SHA512(order_id + status_code + gross_amount + server_key)`.
- Webhook invalid tetap disimpan sebagai log tetapi tidak mengubah donation.
- Smoke test: sandbox settlement, duplicate webhook, invalid signature.

### Telegram

- Notifikasi settlement ke admin chat.
- Admin read/write commands dari chat allowlist.
- Scheduled daily/weekly/health/reminder jobs.
- Public bot command dan `/broadcast_laporan` ke channel publik.
- Receipt photo + approval flow.
- Smoke test: `/saldo`, `/laporan`, `/pengeluaran ...`, `/broadcast_laporan`, cron endpoint dengan `CRON_SECRET`.

### WhatsApp reminder

- Meta WhatsApp Cloud API.
- Kirim reminder hanya ke donatur dengan explicit opt-in dan nomor WhatsApp valid.
- Admin endpoint default dry-run.
- Cron endpoint protected by `CRON_SECRET`.
- Smoke test: dry-run endpoint, live template send bila Meta env aktif.

### Email/Resend

- Password reset.
- Admin settlement notification.
- Failed login, large expense/delete, invalid signature, health/ops, backup failure alerts.
- Failure email tidak boleh menggagalkan flow utama.
- Smoke test: kirim reset password dan settlement email sandbox.

### Backup/restore

- `scripts/backup-postgres.sh` membuat backup PostgreSQL compressed + checksum.
- `scripts/restore-drill-postgres.sh` melakukan restore drill ke container temporary.
- Smoke test: manual backup, checksum OK, restore drill query table utama.

## Export dan print

- Public export: `/api/reports/public/export?format=pdf|csv` untuk siklus Jumat.
- Admin export: `/api/admin/reports/export`.
- Print A4: tombol `Cetak Laporan A4` di `/laporan`.
- Smoke test: PDF/CSV terbuka, total cocok dengan UI, contact field donor tidak muncul.

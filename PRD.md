# Product Requirements Document (PRD)

# Aplikasi Donasi Jumat Berkah

## 1. Ringkasan Produk

Aplikasi Donasi Jumat Berkah adalah aplikasi web untuk mengelola donasi publik secara digital melalui QRIS Midtrans, serta menampilkan laporan pemasukan dan pengeluaran program Jumat Berkah secara transparan kepada siapa saja.

Program Jumat Berkah saat ini berjalan secara manual: pegawai atau donatur mengumpulkan uang, dana dipakai untuk memasak nasi, lalu makanan disetorkan ke masjid belakang kantor. Aplikasi ini dibuat untuk mengurangi pekerjaan manual, memudahkan donasi, mempercepat rekonsiliasi pembayaran, dan meningkatkan transparansi laporan.

## 2. Tujuan Produk

### 2.1 Tujuan Utama

- Memudahkan siapa saja berdonasi untuk program Jumat Berkah via QRIS.
- Mengotomatisasi pencatatan donasi masuk melalui integrasi Midtrans.
- Menyediakan laporan pemasukan dan pengeluaran yang dapat diakses publik.
- Membantu admin mengelola transaksi, pengeluaran, dan laporan program.

### 2.2 Tujuan Bisnis/Sosial

- Meningkatkan partisipasi donatur karena proses donasi lebih mudah.
- Meningkatkan kepercayaan publik melalui laporan terbuka.
- Mengurangi risiko salah catat pada pencatatan manual.
- Memudahkan dokumentasi kegiatan Jumat Berkah dari waktu ke waktu.

## 3. Target Pengguna

### 3.1 Donatur Publik

Pengguna umum yang ingin berdonasi tanpa wajib login. Donatur dapat mengisi nama atau memilih anonim, memasukkan nominal donasi, lalu membayar dengan QRIS.

### 3.2 Donatur Terdaftar

Pengguna yang login opsional untuk melihat riwayat donasi pribadi dan menyimpan profil dasar.

### 3.3 Admin Program

Pengelola program Jumat Berkah yang bertugas memantau donasi, mencatat pengeluaran, mengelola laporan, dan memastikan data pembayaran sudah sinkron dengan Midtrans.

### 3.4 Publik/Penerima Informasi

Siapa saja yang ingin melihat laporan pemasukan dan pengeluaran tanpa perlu login.

## 4. Masalah yang Diselesaikan

| Masalah Saat Ini | Dampak | Solusi Aplikasi |
|---|---|---|
| Penarikan donasi manual | Admin harus menagih/mengingatkan satu per satu | Donatur bisa bayar langsung via QRIS |
| Pencatatan donasi manual | Rawan salah catat dan lambat direkap | Donasi sukses otomatis tercatat dari Midtrans |
| Laporan manual | Sulit dibagikan dan diperbarui | Laporan publik real-time/periodik tersedia di web |
| Bukti pembayaran tersebar | Rekonsiliasi sulit | Status pembayaran otomatis melalui webhook Midtrans |
| Transparansi terbatas | Kepercayaan bergantung pada laporan informal | Publik dapat melihat pemasukan, pengeluaran, dan saldo |

## 5. Ruang Lingkup Produk

### 5.1 Masuk Scope MVP

- Landing page program Jumat Berkah.
- Form donasi publik tanpa wajib login.
- Pembayaran QRIS via Midtrans.
- Webhook Midtrans untuk update status pembayaran.
- Halaman sukses/gagal/menunggu pembayaran.
- Dashboard admin.
- Manajemen data donasi.
- Manajemen data pengeluaran.
- Laporan pemasukan dan pengeluaran publik.
- Login admin.
- Login opsional donatur.
- Riwayat donasi untuk donatur login.

### 5.2 Di Luar Scope MVP

- Payroll deduction otomatis dari gaji pegawai.
- Subscription donasi berulang otomatis.
- Mobile app native Android/iOS.
- Integrasi akuntansi pihak ketiga.
- Multi-cabang kantor.
- Pengelolaan stok bahan makanan.
- Sistem persetujuan pengeluaran bertingkat.

## 6. Asumsi Produk

- Donasi dibuka untuk publik penuh.
- Donatur tidak wajib login.
- Login donatur bersifat opsional.
- Pembayaran utama menggunakan QRIS melalui Midtrans.
- Admin wajib login.
- Laporan pemasukan dan pengeluaran dapat dilihat siapa saja tanpa login.
- Stack teknologi rekomendasi: Next.js, PostgreSQL, Tailwind CSS.

## 7. User Journey

### 7.1 Donasi Tanpa Login

1. Donatur membuka halaman utama aplikasi.
2. Donatur melihat informasi program Jumat Berkah.
3. Donatur klik tombol `Donasi Sekarang`.
4. Donatur mengisi nama atau memilih anonim.
5. Donatur mengisi nominal donasi.
6. Sistem membuat transaksi Midtrans.
7. Donatur melihat QRIS dan melakukan pembayaran.
8. Midtrans mengirim webhook ke aplikasi.
9. Sistem memperbarui status donasi menjadi berhasil.
10. Donatur melihat halaman terima kasih.
11. Donasi masuk ke laporan pemasukan publik.

### 7.2 Donasi Dengan Login Opsional

1. Donatur login.
2. Donatur memilih nominal donasi.
3. Sistem memakai data profil donatur.
4. Donatur membayar via QRIS.
5. Setelah sukses, donasi tersimpan dalam riwayat akun.

### 7.3 Admin Mencatat Pengeluaran

1. Admin login ke dashboard.
2. Admin membuka menu pengeluaran.
3. Admin menambahkan item pengeluaran, tanggal, nominal, kategori, deskripsi, dan bukti opsional.
4. Sistem menyimpan pengeluaran.
5. Pengeluaran muncul pada laporan publik.
6. Saldo program diperbarui.

### 7.4 Publik Melihat Laporan

1. Pengunjung membuka halaman laporan.
2. Pengunjung memilih periode laporan.
3. Sistem menampilkan total pemasukan, total pengeluaran, saldo, daftar transaksi, dan ringkasan kegiatan.

## 8. Fitur Produk

## 8.1 Landing Page

### Deskripsi

Halaman utama untuk menjelaskan program Jumat Berkah, tujuan donasi, cara kerja, dan ajakan berdonasi.

### Kebutuhan Fungsional

- Menampilkan nama program.
- Menampilkan deskripsi singkat program.
- Menampilkan CTA `Donasi Sekarang`.
- Menampilkan CTA `Lihat Laporan`.
- Menampilkan ringkasan total donasi bulan ini.
- Menampilkan ringkasan total pengeluaran bulan ini.
- Menampilkan saldo berjalan.
- Menampilkan dokumentasi kegiatan opsional.

### Acceptance Criteria

- Pengunjung dapat memahami tujuan program dalam kurang dari 30 detik.
- Tombol donasi mengarah ke form donasi.
- Tombol laporan mengarah ke halaman laporan publik.

## 8.2 Form Donasi Publik

### Deskripsi

Form untuk membuat transaksi donasi tanpa wajib login.

### Field

- Nama donatur: opsional jika memilih anonim.
- Email: opsional.
- Nomor WhatsApp: opsional.
- Nominal donasi: wajib.
- Pesan/doa: opsional.
- Tampilkan nama di laporan: ya/tidak.

### Aturan Validasi

- Nominal minimal: Rp1.000 atau sesuai konfigurasi admin.
- Nominal wajib angka positif.
- Email harus valid jika diisi.
- Nama disimpan sebagai `Anonim` jika donatur memilih anonim.

### Acceptance Criteria

- Donatur dapat membuat transaksi tanpa login.
- Sistem tidak membuat transaksi jika nominal tidak valid.
- Sistem membuat order ID unik untuk setiap donasi.

## 8.3 Pembayaran QRIS Midtrans

### Deskripsi

Sistem membuat transaksi Midtrans dan menampilkan pembayaran QRIS kepada donatur.

### Kebutuhan Fungsional

- Integrasi Midtrans Snap atau Core API.
- Mendukung pembayaran QRIS.
- Menyimpan status transaksi: `pending`, `settlement`, `expire`, `cancel`, `deny`, `failure`, `refund`.
- Menampilkan halaman pembayaran atau redirect ke Snap page.
- Menampilkan instruksi pembayaran.

### Acceptance Criteria

- Transaksi berhasil dibuat di Midtrans.
- Donatur dapat melihat QRIS.
- Status awal donasi tersimpan sebagai `pending`.
- Status berubah otomatis setelah webhook diterima.

## 8.4 Webhook Midtrans

### Deskripsi

Endpoint server untuk menerima notifikasi status pembayaran dari Midtrans.

### Kebutuhan Fungsional

- Menerima webhook Midtrans.
- Memverifikasi signature key.
- Mencocokkan `order_id` dengan data donasi.
- Memperbarui status donasi.
- Mencegah update ganda yang merusak data.
- Menyimpan raw payload webhook untuk audit.

### Acceptance Criteria

- Webhook dengan signature tidak valid ditolak.
- Donasi berubah menjadi sukses saat status Midtrans `settlement` atau `capture` valid.
- Webhook berulang tidak menggandakan pemasukan.
- Semua webhook tercatat untuk kebutuhan audit.

## 8.5 Halaman Status Donasi

### Deskripsi

Halaman hasil setelah donatur membuat pembayaran.

### Status

- Menunggu pembayaran.
- Pembayaran berhasil.
- Pembayaran gagal.
- Pembayaran kedaluwarsa.

### Acceptance Criteria

- Donatur dapat melihat status pembayaran terbaru.
- Donatur mendapat pesan jelas untuk setiap status.
- Status sukses menampilkan ucapan terima kasih.

## 8.6 Login Opsional Donatur

### Deskripsi

Donatur dapat login untuk melihat riwayat donasi pribadi. Login tidak boleh menjadi hambatan untuk berdonasi.

### Kebutuhan Fungsional

- Login via email magic link atau OAuth Google.
- Profil donatur berisi nama dan email.
- Riwayat donasi pribadi.
- Donasi tanpa login tetap tersedia.

### Acceptance Criteria

- Donatur dapat berdonasi tanpa akun.
- Donatur login dapat melihat donasi yang terhubung ke akunnya.
- Donasi anonim tidak menampilkan identitas publik.

## 8.7 Dashboard Admin

### Deskripsi

Dashboard internal untuk pengelola program.

### Kebutuhan Fungsional

- Login admin.
- Ringkasan pemasukan, pengeluaran, saldo.
- Daftar donasi.
- Filter donasi berdasarkan status, tanggal, nama, nominal.
- Detail donasi.
- Daftar pengeluaran.
- Form tambah/edit/hapus pengeluaran.
- Export laporan CSV.

### Acceptance Criteria

- Admin dapat melihat semua transaksi donasi.
- Admin dapat menambah pengeluaran.
- Admin dapat memperbarui data pengeluaran.
- Admin dapat export laporan.

## 8.8 Manajemen Pengeluaran

### Deskripsi

Fitur untuk mencatat biaya program, misalnya bahan makanan, gas, transportasi, kemasan, dan operasional lain.

### Field

- Tanggal pengeluaran.
- Kategori.
- Deskripsi.
- Nominal.
- Nama penerima/vendor opsional.
- Bukti transaksi opsional.
- Dicatat oleh admin.

### Kategori Awal

- Bahan makanan.
- Lauk pauk.
- Beras.
- Gas/alat masak.
- Kemasan.
- Transportasi.
- Operasional lain.

### Acceptance Criteria

- Pengeluaran mengurangi saldo laporan.
- Pengeluaran tampil di laporan publik.
- Pengeluaran dapat diedit admin.
- Perubahan pengeluaran tercatat dalam audit log.

## 8.9 Laporan Publik

### Deskripsi

Halaman transparansi yang dapat diakses siapa saja tanpa login.

### Kebutuhan Fungsional

- Menampilkan total pemasukan.
- Menampilkan total pengeluaran.
- Menampilkan saldo berjalan.
- Filter periode: minggu ini, bulan ini, tahun ini, custom date.
- Daftar donasi sukses.
- Daftar pengeluaran.
- Ringkasan per kategori pengeluaran.
- Donatur anonim ditampilkan sebagai `Anonim`.
- Donatur yang memilih tidak tampil nama harus disamarkan.

### Acceptance Criteria

- Halaman laporan dapat dibuka tanpa login.
- Hanya donasi sukses yang masuk total pemasukan.
- Pengeluaran yang sudah tercatat masuk total pengeluaran.
- Saldo = total pemasukan sukses - total pengeluaran.

## 8.10 Audit Log

### Deskripsi

Catatan aktivitas penting untuk menjaga integritas laporan.

### Kebutuhan Fungsional

- Mencatat admin yang membuat/mengubah/menghapus pengeluaran.
- Mencatat perubahan status donasi dari webhook.
- Mencatat raw webhook Midtrans.
- Mencatat waktu aktivitas.

### Acceptance Criteria

- Aktivitas penting dapat ditelusuri.
- Audit log tidak dapat diubah melalui UI normal.

## 9. Role dan Hak Akses

| Role | Hak Akses |
|---|---|
| Pengunjung | Donasi, lihat laporan publik |
| Donatur Login | Donasi, lihat laporan publik, lihat riwayat donasi pribadi |
| Admin | Kelola donasi, pengeluaran, laporan, export, audit |

## 10. Data Model Awal

### 10.1 Users

Menyimpan data user login, baik donatur maupun admin.

| Field | Tipe | Catatan |
|---|---|---|
| id | UUID | Primary key |
| name | string | Nama user |
| email | string | Unique |
| role | enum | `donor`, `admin` |
| created_at | timestamp | Waktu dibuat |
| updated_at | timestamp | Waktu diperbarui |

### 10.2 Donations

Menyimpan semua transaksi donasi.

| Field | Tipe | Catatan |
|---|---|---|
| id | UUID | Primary key |
| order_id | string | Unique, dikirim ke Midtrans |
| user_id | UUID nullable | Terisi jika donatur login |
| donor_name | string nullable | Nama input donatur |
| donor_email | string nullable | Email input donatur |
| donor_phone | string nullable | Nomor WhatsApp opsional |
| is_anonymous | boolean | Jika true tampil sebagai Anonim |
| show_name_publicly | boolean | Kontrol tampilan nama publik |
| amount | integer | Dalam Rupiah |
| message | text nullable | Pesan/doa |
| payment_provider | string | `midtrans` |
| payment_method | string | `qris` |
| status | enum | `pending`, `settlement`, `expire`, `cancel`, `deny`, `failure`, `refund` |
| midtrans_transaction_id | string nullable | Dari Midtrans |
| paid_at | timestamp nullable | Waktu sukses bayar |
| created_at | timestamp | Waktu dibuat |
| updated_at | timestamp | Waktu diperbarui |

### 10.3 Expenses

Menyimpan pengeluaran program.

| Field | Tipe | Catatan |
|---|---|---|
| id | UUID | Primary key |
| expense_date | date | Tanggal pengeluaran |
| category | string | Kategori pengeluaran |
| description | text | Deskripsi |
| amount | integer | Dalam Rupiah |
| vendor_name | string nullable | Vendor/penerima opsional |
| receipt_url | string nullable | Bukti transaksi opsional |
| created_by | UUID | Admin pembuat |
| created_at | timestamp | Waktu dibuat |
| updated_at | timestamp | Waktu diperbarui |

### 10.4 Midtrans Webhook Logs

Menyimpan payload webhook untuk audit.

| Field | Tipe | Catatan |
|---|---|---|
| id | UUID | Primary key |
| order_id | string | Order ID transaksi |
| transaction_status | string | Status dari Midtrans |
| fraud_status | string nullable | Fraud status dari Midtrans |
| signature_valid | boolean | Hasil validasi signature |
| raw_payload | jsonb | Payload lengkap |
| received_at | timestamp | Waktu diterima |

### 10.5 Audit Logs

Menyimpan aktivitas penting aplikasi.

| Field | Tipe | Catatan |
|---|---|---|
| id | UUID | Primary key |
| actor_user_id | UUID nullable | User/admin pelaku |
| action | string | Jenis aktivitas |
| entity_type | string | Contoh: `donation`, `expense` |
| entity_id | UUID/string | ID entitas |
| before | jsonb nullable | Data sebelum perubahan |
| after | jsonb nullable | Data setelah perubahan |
| created_at | timestamp | Waktu aktivitas |

## 11. API Endpoint Awal

### 11.1 Public

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/` | Landing page |
| GET | `/donasi` | Form donasi |
| POST | `/api/donations` | Membuat transaksi donasi |
| GET | `/donasi/status/:orderId` | Melihat status donasi |
| GET | `/laporan` | Laporan publik |
| GET | `/api/reports/public` | Data laporan publik |

### 11.2 Midtrans

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/webhooks/midtrans` | Menerima notifikasi pembayaran |

### 11.3 Donatur Login

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/akun/donasi` | Riwayat donasi pribadi |
| GET | `/api/me/donations` | API riwayat donasi pribadi |

### 11.4 Admin

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/admin` | Dashboard admin |
| GET | `/admin/donasi` | Daftar donasi |
| GET | `/admin/pengeluaran` | Daftar pengeluaran |
| POST | `/api/admin/expenses` | Tambah pengeluaran |
| PATCH | `/api/admin/expenses/:id` | Edit pengeluaran |
| DELETE | `/api/admin/expenses/:id` | Hapus pengeluaran |
| GET | `/api/admin/reports/export` | Export laporan CSV |

## 12. Kebutuhan Non-Fungsional

### 12.1 Keamanan

- Semua endpoint admin wajib autentikasi.
- Role admin wajib dicek di server.
- Webhook Midtrans wajib validasi signature key.
- Secret Midtrans tidak boleh diekspos ke client.
- Input nominal harus divalidasi di server.
- Data pribadi donatur tidak boleh tampil publik tanpa izin.

### 12.2 Privasi

- Donatur dapat memilih anonim.
- Email dan nomor WhatsApp tidak tampil di laporan publik.
- Nama donatur hanya tampil jika `show_name_publicly = true` dan tidak anonim.

### 12.3 Reliabilitas

- Webhook harus idempotent.
- Status donasi tidak boleh berubah sembarangan setelah settlement.
- Kegagalan webhook harus bisa ditelusuri dari log.

### 12.4 Performa

- Landing page target load < 3 detik pada koneksi normal.
- Halaman laporan memakai pagination/filter agar tetap cepat.
- Query laporan memakai index pada tanggal dan status.

### 12.5 Aksesibilitas

- Form bisa digunakan via keyboard.
- Kontras warna cukup.
- Pesan error form jelas.

## 13. Rekomendasi Stack Teknologi

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend | Next.js App Router | Full-stack web, routing kuat, cocok SSR/SEO |
| Styling | Tailwind CSS | Cepat, konsisten, mudah maintenance |
| Database | PostgreSQL | Stabil untuk transaksi dan laporan |
| ORM | Prisma atau Drizzle | Type-safe database access |
| Auth | NextAuth/Auth.js | Mendukung Google/email login |
| Payment | Midtrans Snap/Core API | Mendukung QRIS Indonesia |
| Hosting | Vercel/Railway/Fly.io | Deploy cepat untuk MVP |
| Storage Bukti | S3-compatible/R2 | Simpan bukti pengeluaran opsional |

## 14. Integrasi Midtrans

### 14.1 Flow Pembayaran

1. Donatur submit form donasi.
2. Server membuat record donation status `pending`.
3. Server membuat transaksi ke Midtrans dengan `order_id` unik.
4. Server mengembalikan Snap token/payment URL/QRIS instruction.
5. Donatur membayar.
6. Midtrans mengirim webhook.
7. Server validasi signature.
8. Server update status donation.
9. Laporan publik otomatis berubah.

### 14.2 Data Midtrans Minimum

- `order_id`
- `gross_amount`
- `customer_details`
- `enabled_payments`: QRIS jika memakai Snap dan ingin membatasi metode.

### 14.3 Status Mapping

| Midtrans Status | Status Internal | Efek Laporan |
|---|---|---|
| `pending` | `pending` | Tidak dihitung pemasukan |
| `settlement` | `settlement` | Dihitung pemasukan |
| `capture` + valid | `settlement` | Dihitung pemasukan |
| `expire` | `expire` | Tidak dihitung pemasukan |
| `cancel` | `cancel` | Tidak dihitung pemasukan |
| `deny` | `deny` | Tidak dihitung pemasukan |
| `failure` | `failure` | Tidak dihitung pemasukan |
| `refund` | `refund` | Dikurangi/dikecualikan dari pemasukan |

## 15. Metrik Keberhasilan

- Jumlah donasi sukses per minggu/bulan.
- Total nominal donasi per minggu/bulan.
- Persentase transaksi sukses dibanding transaksi dibuat.
- Waktu admin untuk membuat laporan turun signifikan.
- Laporan publik aktif dan dapat diakses tanpa kendala.
- Jumlah donatur berulang.

## 16. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Webhook gagal diterima | Status pembayaran tidak update | Simpan log, sediakan tombol sync manual dari admin |
| Donatur bingung bayar QRIS | Donasi gagal | Instruksi pembayaran jelas dan halaman status mudah dipahami |
| Salah input pengeluaran | Laporan tidak akurat | Audit log dan fitur edit dengan riwayat perubahan |
| Data pribadi bocor | Kepercayaan turun | Jangan tampilkan email/phone publik, kontrol anonim |
| Midtrans sandbox/production salah config | Pembayaran gagal | Pisahkan environment variable dan checklist deploy |

## 17. Prioritas MVP

### P0 - Wajib Ada

- Donasi publik tanpa login.
- Pembayaran QRIS Midtrans.
- Webhook Midtrans valid dan aman.
- Laporan publik pemasukan/pengeluaran.
- Dashboard admin dasar.
- Manajemen pengeluaran.

### P1 - Penting Setelah P0

- Login opsional donatur.
- Riwayat donasi pribadi.
- Export CSV.
- Upload bukti pengeluaran.
- Audit log detail.

### P2 - Pengembangan Lanjutan

- Dokumentasi kegiatan dengan foto.
- Reminder donasi mingguan.
- Donasi berulang.
- Grafik laporan.
- Halaman campaign khusus.

## 18. Milestone Pengembangan

### Milestone 1 - Fondasi

- Setup Next.js, Tailwind, PostgreSQL.
- Setup schema database.
- Setup autentikasi admin.
- Setup halaman landing dan layout dasar.

### Milestone 2 - Donasi dan Midtrans

- Form donasi.
- Create transaction Midtrans.
- Halaman status donasi.
- Webhook Midtrans.
- Log webhook.

### Milestone 3 - Admin dan Pengeluaran

- Dashboard admin.
- Daftar donasi.
- CRUD pengeluaran.
- Audit log dasar.

### Milestone 4 - Laporan Publik

- Halaman laporan publik.
- Filter periode.
- Ringkasan saldo.
- Daftar pemasukan dan pengeluaran.

### Milestone 5 - Donatur Login Opsional

- Login donatur.
- Profil dasar.
- Riwayat donasi pribadi.

## 19. Open Questions

- Nominal minimal donasi final berapa?
- Apakah laporan publik perlu menampilkan nama donatur atau cukup agregat?
- Apakah bukti pengeluaran wajib di-upload atau opsional?
- Siapa saja admin awal?
- Apakah perlu approval sebelum pengeluaran tampil di laporan publik?
- Apakah program hanya satu campaign permanen atau butuh campaign per Jumat/per bulan?

## 20. Definisi Sukses MVP

MVP dianggap sukses jika donatur publik dapat membuka aplikasi, mengisi nominal donasi, membayar via QRIS Midtrans, status pembayaran otomatis tercatat, admin dapat mencatat pengeluaran, dan publik dapat melihat laporan pemasukan, pengeluaran, serta saldo secara transparan tanpa login.

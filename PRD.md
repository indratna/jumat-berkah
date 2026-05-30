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
- Notifikasi Telegram donasi settlement ke chat admin.
- Catat pengeluaran via perintah Telegram dari chat admin yang ada di allowlist.

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

- Integrasi Midtrans Snap.
- Mendukung pembayaran QRIS.
- Menyimpan status transaksi: `pending`, `settlement`, `expire`, `cancel`, `deny`, `failure`, `refund`.
- Menampilkan Snap popup ketika script Midtrans tersedia di browser, atau melakukan redirect ke halaman pembayaran Midtrans sebagai fallback bila popup tidak bisa dipakai.
- Setelah popup selesai, pending, error, atau ditutup, donatur diarahkan ke halaman status donasi internal.
- Status akhir tetap diverifikasi oleh webhook Midtrans, bukan oleh callback popup.

### Acceptance Criteria

- Transaksi berhasil dibuat di Midtrans.
- Donatur dapat melihat QRIS via Snap popup atau halaman pembayaran fallback.
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

## 8.11 Notifikasi & Bot Telegram

### Deskripsi

Integrasi Telegram Bot untuk mengirim notifikasi donasi settlement ke chat admin dan menerima perintah pencatatan pengeluaran dari chat admin yang masuk allowlist. Fitur opsional dan opt-in melalui environment variable.

### Kebutuhan Fungsional

- Mengirim notifikasi ke chat admin saat donasi berubah status menjadi `settlement`.
- Notifikasi hanya terkirim sekali per perubahan status (idempoten terhadap webhook ganda).
- Notifikasi tidak boleh memuat email atau nomor donatur.
- Notifikasi memakai aturan privasi laporan publik (`Anonim` jika anonim atau nama disembunyikan).
- Menerima perintah `/pengeluaran` dari chat admin yang ada di allowlist.
- Menerima perintah read-only admin: `/saldo`, `/donasi_terbaru`, `/pengeluaran_terbaru`, `/cari`, `/laporan`, dan `/csv`.
- Menerima perintah admin write dengan konfirmasi: `/edit_pengeluaran` dan `/hapus_pengeluaran`.
- Memverifikasi secret token webhook Telegram pada header `X-Telegram-Bot-Api-Secret-Token`.
- Memvalidasi input perintah seperti API admin pengeluaran (tanggal, kategori, nominal, deskripsi, vendor opsional).
- Membuat audit log untuk setiap pengeluaran via Telegram dengan penanda channel `telegram`.
- Kegagalan kirim notifikasi tidak boleh menggagalkan webhook Midtrans.
- Allowlist chat admin dikelola via environment variable, bukan hardcoded.

### Acceptance Criteria

- Hanya chat admin di allowlist yang dapat membuat pengeluaran via Telegram.
- Webhook Telegram dengan secret token salah ditolak.
- Perintah dengan format invalid tidak membuat pengeluaran dan menampilkan petunjuk format.
- Perintah read-only Telegram hanya dapat dijalankan dari chat admin yang masuk allowlist.
- Balasan read-only memakai format Rupiah dan tidak mengekspos email/nomor donatur.
- Edit/hapus pengeluaran via Telegram hanya berjalan setelah konfirmasi dari admin chat/user yang sama.
- Edit/hapus pengeluaran via Telegram membuat audit log before/after.
- Donasi settlement memicu tepat satu notifikasi per perubahan status.
- Notifikasi tidak pernah mengekspos email/nomor donatur.
- Telegram bot mati atau tidak dikonfigurasi tidak menggagalkan flow donasi atau webhook Midtrans.

## 9. Role dan Hak Akses

| Role | Hak Akses |
|---|---|
| Pengunjung | Donasi, lihat laporan publik |
| Donatur Login | Donasi, lihat laporan publik, lihat riwayat donasi pribadi |
| Admin | Kelola donasi, pengeluaran, laporan, export, audit |
| Admin Telegram (chat di allowlist) | Catat pengeluaran via perintah `/pengeluaran` dan menerima notifikasi donasi settlement |

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

### 11.2a Telegram

| Method | Endpoint | Fungsi |
|---|---|---|
| POST | `/api/webhooks/telegram` | Menerima update Telegram (perintah admin) dengan verifikasi secret token |

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
- Webhook Telegram wajib validasi secret token via header `X-Telegram-Bot-Api-Secret-Token`.
- Allowlist chat admin Telegram wajib dicek di server sebelum aksi tulis.
- Secret Midtrans dan token bot Telegram tidak boleh diekspos ke client.
- Input nominal harus divalidasi di server.
- Data pribadi donatur tidak boleh tampil publik tanpa izin.

### 12.2 Privasi

- Donatur dapat memilih anonim.
- Email dan nomor WhatsApp tidak tampil di laporan publik.
- Nama donatur hanya tampil jika `show_name_publicly = true` dan tidak anonim.
- Notifikasi Telegram memakai aturan publik yang sama (Anonim untuk donatur anonim/disembunyikan, tidak pernah memuat email atau nomor).

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
- Notifikasi Telegram donasi settlement ke admin.
- Catat pengeluaran via perintah Telegram untuk admin di allowlist.

### P2 - Pengembangan Lanjutan

- Dokumentasi kegiatan dengan foto.
- Reminder donasi mingguan.
- Donasi berulang.
- Grafik laporan.
- Halaman campaign khusus.
- Perintah admin Telegram read-only: `/saldo`, `/donasi_terbaru`, `/pengeluaran_terbaru`, `/cari`, `/laporan`, `/csv`.
- Perintah admin Telegram tulis dengan konfirmasi: `/edit_pengeluaran`, `/hapus_pengeluaran`.
- (future) Notifikasi terjadwal Telegram: ringkasan harian Jumat, mingguan, alert saldo rendah, alert pending donation, alert webhook signature invalid.
- (future) Upload struk via Telegram dan approval pengeluaran besar.
- (done) Self-service donatur via Telegram dan reminder Jumat opt-in (informational, bukan auto debit).
- Bot publik transparansi: `/saldo_publik`, `/pengeluaran_publik`, `/laporan_publik`, dan broadcast laporan mingguan ke channel publik.
- Alert operasional dan keamanan via Telegram: failed login berulang, audit log kritis, dan health check.

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

### Milestone 6 - Notifikasi & Bot Telegram

- Bot Telegram terkonfigurasi dengan secret token dan allowlist admin chat.
- Notifikasi Telegram saat donasi settlement.
- Perintah `/pengeluaran` untuk admin di allowlist.
- Cloudflare DNS, TLS, dan setup webhook didokumentasikan.
- Perintah publik Telegram menampilkan data transparansi tanpa email, nomor WhatsApp, atau ID internal.
- Admin allowlist dapat menjalankan `/broadcast_laporan` untuk mengirim ringkasan mingguan ke channel publik.
- Telegram mengirim alert operasional untuk failed admin login berulang, pengeluaran besar/dihapus, dan health check bermasalah.

## 19. Open Questions

- Nominal minimal donasi final berapa?
- Apakah laporan publik perlu menampilkan nama donatur atau cukup agregat?
- Apakah bukti pengeluaran wajib di-upload atau opsional?
- Siapa saja admin awal?
- Apakah perlu approval sebelum pengeluaran tampil di laporan publik?
- Apakah program hanya satu campaign permanen atau butuh campaign per Jumat/per bulan?

## 20. Definisi Sukses MVP

MVP dianggap sukses jika donatur publik dapat membuka aplikasi, mengisi nominal donasi, membayar via QRIS Midtrans, status pembayaran otomatis tercatat, admin dapat mencatat pengeluaran, dan publik dapat melihat laporan pemasukan, pengeluaran, serta saldo secara transparan tanpa login.

## 21. v1.1+ Production Enhancement Roadmap

Bagian ini berisi fitur dekat setelah MVP live. Fitur-fitur ini sudah disetujui sebagai arah produk, tetapi tetap dikerjakan bertahap sesuai `IMPLEMENTATION_PLAN.md` dan aturan `AGENTS.md`: satu fase, satu goal, satu validation cycle.

### 21.1 Prinsip v1.1+

- Tetap menjaga tujuan utama: donasi Jumat Berkah mudah, transparan, dan aman.
- Tidak mengubah non-goals utama tanpa keputusan eksplisit: native mobile app, payroll deduction, recurring auto donation, multi-branch, inventory, dan accounting kompleks tetap bukan scope.
- Semua fitur baru harus menjaga privasi donor: email, nomor telepon, dan identitas donor anonim tidak tampil publik.
- Semua data finansial tetap memakai integer Rupiah dan hanya donasi `settlement` yang dihitung sebagai pemasukan.
- Fitur yang menyentuh auth, payment, email, backup, dan report harus punya acceptance criteria dan validasi sebelum rilis.

### 21.2 v1.1 — Backup & Ops Safety

Tujuan: melindungi data live sebelum perubahan besar berikutnya.

Kebutuhan fungsional:

- Backup database PostgreSQL otomatis harian.
- Retention backup 14–30 hari.
- Restore drill ke target sementara.
- Runbook restore dan recovery.
- Notifikasi gagal backup jika channel admin tersedia.

Acceptance criteria:

- Backup dapat dijalankan manual dan via cron.
- Restore drill membuktikan data users, donations, expenses dapat dibaca.
- Retention hanya menghapus file backup di direktori backup yang ditentukan.
- Tidak menyentuh container/volume aplikasi lain.

### 21.3 v1.2 — Better Auth & Account Management

Tujuan: menyediakan auth standar untuk admin dan donor.

Kebutuhan fungsional:

- Admin dapat login dengan Google OAuth.
- Admin dapat login dengan email/password lokal.
- Donatur dapat login dengan Google OAuth.
- Admin/donatur dapat melihat/mengelola profil dasar.
- Profile picture dapat diambil dari akun Google.
- User email/password dapat mengganti password.
- User dapat reset password melalui email.
- Admin access tetap berbasis role admin, bukan sekadar berhasil login Google.

Acceptance criteria:

- Google login admin hanya memberi akses admin jika user punya role admin.
- Donatur login hanya dapat melihat data donasi miliknya sendiri.
- Password reset aman, time-limited, dan tidak membocorkan keberadaan email.
- Session invalidation berjalan setelah reset/change password jika diaktifkan.

### 21.4 v1.3 — Email Notifications

Tujuan: menambah channel notifikasi admin selain Telegram.

Kebutuhan fungsional:

- Email transaksi/auth: verification/reset password.
- Email admin untuk donasi `settlement`.
- Email admin untuk pengeluaran besar atau event audit kritis.
- Email admin untuk repeated failed login, invalid webhook signature, dan backup failure.
- Template email memakai bahasa Indonesia.

Acceptance criteria:

- Email failure tidak menggagalkan webhook/payment processing.
- Email admin tidak mengekspos data privat ke publik.
- Recipient admin dikonfigurasi dari env/server-side config.

### 21.5 v1.4 — Friday Reporting Cycle

Tujuan: menyesuaikan laporan dengan ritme operasional penyaluran setiap Jumat.

Kebutuhan fungsional:

- Periode laporan Jumat–Kamis.
- Ringkasan laporan Jumat otomatis.
- Auto-post laporan ke Telegram channel setiap Jumat.
- Manual `/broadcast_laporan` tetap tersedia.
- Log/audit hasil broadcast otomatis.

Acceptance criteria:

- Total pemasukan/pengeluaran/saldo sama dengan kalkulasi laporan pusat.
- Auto-post hanya berjalan dari scheduler terproteksi.
- Public report tetap tidak menampilkan email/phone donor.

### 21.6 v1.5 — Weekly Donation Target

Tujuan: menunjukkan target penggalangan dana untuk Jumat berjalan.

Kebutuhan fungsional:

- Admin dapat menentukan target dana per siklus Jumat.
- Landing/report publik menampilkan progress target.
- Reminder admin jika progress masih rendah menjelang Jumat.

Acceptance criteria:

- Progress hanya menghitung donasi `settlement`.
- Target/progress ditampilkan dengan format Rupiah jelas.
- Tidak ada data donor privat pada progress publik.

### 21.7 v1.6 — Distribution Story & Photo Report

Tujuan: meningkatkan transparansi penyaluran.

Kebutuhan fungsional:

- Admin dapat membuat cerita penyaluran Jumat.
- Admin dapat melampirkan foto kegiatan atau bukti penyaluran.
- Publik dapat melihat ringkasan paket/penyaluran.
- Telegram broadcast dapat menyertakan link laporan penyaluran.

Acceptance criteria:

- Cerita publik tidak mengekspos donor email/phone.
- Foto penyaluran harus mengikuti panduan privasi penerima manfaat.
- Admin dapat edit cerita jika ada typo/koreksi.

### 21.8 v1.7 — Public Transparency Enhancements

Tujuan: membuat publik lebih mudah memahami alur dana.

Kebutuhan fungsional:

- Timeline publik donasi sukses, pengeluaran, dan penyaluran.
- Chart kategori pengeluaran.
- Halaman “Tentang Program”.
- Copy publik menjelaskan jadwal, tujuan, pengelola, dan prinsip transparansi.

Acceptance criteria:

- Timeline publik tidak menampilkan email, phone, atau ID internal.
- Chart kategori sesuai total laporan.
- Halaman tentang program mobile-friendly.

### 21.9 v1.8 — Admin Audit & Approval UI

Tujuan: memudahkan admin memeriksa aktivitas dan persetujuan.

Kebutuhan fungsional:

- Dashboard audit log.
- Filter audit berdasarkan tanggal, aktor, event type.
- UI persetujuan pengeluaran besar.
- Timeline approval.

Acceptance criteria:

- Audit log read-only.
- Hanya admin yang bisa mengakses halaman audit/approval.
- Perubahan pengeluaran tetap tercatat di audit log.

### 21.10 v1.9 — Reporting Export Upgrade

Tujuan: memudahkan laporan dibagikan dan diarsipkan.

Kebutuhan fungsional:

- Export PDF laporan periode Jumat.
- Export Excel atau keputusan eksplisit tetap CSV.
- Receipt/bukti donasi yang mudah dibagikan donor.
- Thank-you badge/share text setelah donasi sukses.

Acceptance criteria:

- Export publik tidak mengandung donor email/phone.
- Total export sama dengan public report.
- Receipt hanya menampilkan status/order yang aman untuk donor.

### 21.11 v1.10 — Admin Productivity Tools

Tujuan: mempercepat input operasional rutin admin.

Kebutuhan fungsional:

- Quick expense templates untuk item umum.
- Bulk import pengeluaran dari CSV.
- Preview dan validasi error per baris sebelum import.
- Audit log untuk import.

Acceptance criteria:

- Import menolak row invalid tanpa membuat data parsial yang membingungkan.
- Expense hasil import mempengaruhi saldo dengan benar.
- Import tetap bukan inventory management atau accounting kompleks.

### 21.12 v1.11 — Admin UX & Navigation Cleanup

Tujuan: menyederhanakan navigasi admin agar fitur banyak tetap mudah ditemukan.

Kebutuhan fungsional:

- Sidebar/menu admin dikelompokkan berdasarkan workflow.
- Label menu lebih pendek dan operasional.
- Semua fitur lama tetap dapat diakses.
- Navigasi mobile admin tetap jelas.

Acceptance criteria:

- Admin bisa menemukan area donasi, donor, pengeluaran, laporan, komunikasi, dan audit dalam 1–2 klik.
- Tidak ada broken link admin.
- Sidebar tidak terasa penuh atau membingungkan.

### 21.13 v1.12 — Admin Donor Database

Tujuan: memberi admin database donatur operasional tanpa membuka data privat ke publik.

Kebutuhan fungsional:

- Halaman `/admin/donatur`.
- Daftar donatur dari akun donor dan transaksi guest.
- Search/filter nama, email, nomor WhatsApp, dan aktivitas donasi.
- Ringkasan total donasi berhasil, jumlah donasi, dan donasi terakhir.
- Detail donatur dengan riwayat donasi terkait.

Acceptance criteria:

- Admin bisa mencari donatur by nama/email/phone.
- Total hanya menghitung donasi `settlement`.
- Email/phone hanya tampil di admin.
- Donatur anonim tetap mengikuti aturan public display `Anonim` di area publik.

### 21.14 v1.13 — Communication Consent Foundation

Tujuan: menyiapkan izin komunikasi sebelum WhatsApp reminder dikirim.

Kebutuhan fungsional:

- Donatur dapat opt-in pengingat donasi via WhatsApp.
- Consent tersimpan dengan waktu opt-in.
- Donatur lama default tidak opt-in.
- Admin dapat melihat status consent di database donatur.
- Copy opt-out disiapkan untuk komunikasi WhatsApp.

Acceptance criteria:

- Tidak ada donor yang otomatis dianggap opt-in.
- Consent hanya valid jika donor memberikan nomor WhatsApp.
- Belum ada pengiriman WhatsApp pada fase ini.
- Status consent terlihat admin.

### 21.15 v1.14 — WhatsApp Donation Reminder

Tujuan: mengirim pengingat donasi Jumat Berkah via WhatsApp kepada donor yang sudah opt-in.

Kebutuhan fungsional:

- Integrasi WhatsApp Cloud API resmi Meta sebagai default rekomendasi.
- Reminder memakai template message yang disetujui provider.
- Kirim hanya ke donor opt-in.
- Admin dapat preview/dry-run sebelum live send.
- Reminder bisa dijalankan manual admin dan/atau terjadwal.
- Audit log untuk sent/skipped/failed.

Acceptance criteria:

- Tidak mengirim ke donor tanpa opt-in.
- Token WhatsApp tidak pernah terekspos ke client.
- Gagal kirim tidak menggagalkan seluruh batch/cron.
- Semua hasil pengiriman tercatat.

### 21.16 v1.15 — Report Print & Public Report Redesign

Tujuan: membuat laporan publik dan hasil print/PDF lebih rapi, formal, dan mudah dibagikan.

Kebutuhan fungsional:

- Redesign halaman `/laporan`.
- Print button untuk publik.
- Layout print A4 yang rapi.
- PDF/export report lebih informatif.
- Sembunyikan tombol/filter/navigation saat print.
- Tetap menampilkan ringkasan pemasukan, pengeluaran, saldo, target, dan cerita penyaluran bila ada.

Acceptance criteria:

- Donatur/umum dapat print laporan yang rapi.
- Total print/PDF sama dengan public report.
- Tidak ada email/phone donor di print/PDF.
- Mobile report tetap nyaman dibaca.

### 21.17 v1.16 — Documentation & Env Setup Guide

Tujuan: membuat dokumentasi lengkap semua fitur dan semua environment variable.

Kebutuhan fungsional:

- Dokumentasi fitur publik, donor, admin, Telegram, WhatsApp, Midtrans, email, backup, audit, approval, dan export.
- Dokumentasi semua env var: fungsi, wajib/opsional, contoh aman, dan cara mendapatkannya.
- Panduan provider: Midtrans, Telegram, Resend/email, Better Auth/Google OAuth, WhatsApp Cloud API, database, cron, backup, dan deployment.
- Production checklist dan smoke test per integrasi.

Acceptance criteria:

- Maintainer baru bisa setup local dan production dari docs.
- `.env.example` konsisten dengan docs.
- Tidak ada secret asli di dokumentasi.
- Semua integrasi punya langkah smoke test.

### 21.18 v1.17 — Final QA & Production Readiness Review

Tujuan: memastikan aplikasi siap dipakai setelah review tambahan.

Kebutuhan fungsional:

- Full end-to-end smoke test.
- Security/privacy review.
- Broken link/navigation review.
- Production env checklist review.
- Dokumentasi blocker tersisa.

Acceptance criteria:

- Tidak ada critical bug yang diketahui.
- Public view/export/print tidak menampilkan kontak donor.
- Checklist production lengkap atau blocker eksplisit.
- Status akhir mencerminkan kesiapan nyata.

### 21.19 v1.18 — Donation Checkout UX Enhancement

Tujuan: membuat handoff pembayaran Midtrans dari halaman donasi terasa lebih mulus tanpa mengubah aturan payment safety.

Kebutuhan fungsional:

- Halaman `/donasi` membuka Midtrans Snap popup ketika script Snap dan client key tersedia di browser.
- Jika popup gagal dimuat atau dibuka, alur tetap fallback ke redirect Midtrans yang aman menggunakan `redirectUrl` dari respons API donasi.
- Setelah popup selesai, pending, error, atau ditutup, donor diarahkan ke `/donasi/status/[orderId]` sehingga status final tetap mengikuti server/webhook.
- Copy dan transisi checkout tetap singkat, jelas, dan menenangkan untuk donatur publik.

Acceptance criteria:

- Pembuatan transaksi dan redirect fallback tetap berjalan.
- Status akhir donasi tetap mengikuti webhook Midtrans, bukan callback client.
- Donatur tetap dapat melihat halaman status donasi terbaru dengan order id yang benar.
- Tidak ada data donor privat yang terekspos pada popup handoff atau status publik.
- Implementasi dijaga oleh helper terpusat (`snap-checkout.ts`) dengan unit test untuk popup vs fallback decision.

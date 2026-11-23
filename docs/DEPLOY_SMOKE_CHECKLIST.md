# Checklist Smoke Deploy

Urutan verifikasi setelah deploy build terbaru, sebelum kampanye donasi
diumumkan. Checklist ini generik: gunakan domain dan kredensial Anda sendiri,
dan **jangan** menulis token, secret, atau alamat internal ke repository.

## 0. Prasyarat

- [ ] `main` sudah di-deploy dan commit id dicatat.
- [ ] Environment production sesuai `ENV_SETUP.md`; tidak ada secret di repository.
- [ ] Database dapat diakses dan migration produksi sudah diterapkan sesuai
      `PRODUCTION_CHECKLIST.md` bagian 2. Tidak ada perubahan schema di Phase
      49–52, tetapi prosedur `prisma migrate deploy` tetap berlaku untuk deploy
      umum.

## 1. Deploy build terbaru

```bash
git pull origin main
npm install
npm run db:generate
npm run build
# restart proses/container sesuai setup deployment Anda
```

Untuk deployment Docker, ikuti urutan build + migrator + `compose up` di
`PRODUCTION_CHECKLIST.md` bagian 2. Pastikan `NEXT_PUBLIC_*` ikut tertanam saat
build image.

## 2. Preflight otomatis

```bash
npm run smoke:security -- --base-url https://your-domain.example --mutations --json > preflight-smoke.json
```

- [ ] Exit code `0`.
- [ ] Guest `/api/admin/*` ditolak (`401`), dan mutation dengan origin asing
      ditolak (`403`).
- [ ] Header `Content-Security-Policy-Report-Only` dan `Reporting-Endpoints`
      hadir di respons publik.
- [ ] Tidak ada header `Content-Security-Policy` yang enforced.

Lihat `PREFLIGHT_SMOKE_RUNBOOK.md` untuk flags dan arti setiap check. Jalankan
`--rate-limit` hanya dari mesin operator: check itu memblokir IP selama 10
menit.

## 3. CSP report-only

- [ ] Setelah beberapa halaman publik dibuka, log server berisi baris
      `csp-report {...}`.
- [ ] Baris log tidak memuat query string, email, telepon, atau `script-sample`.
- [ ] Laporan yang muncul berasal dari domain Midtrans/Google yang diharapkan, bukan
      origin asing yang tidak dikenal.

Jika ada origin tak dikenal, evaluasi dulu sebelum menambahkannya ke allowlist.
Lihat `CSP_REPORT_ONLY.md`.

## 4. Smoke donasi sandbox (Phase 52)

- [ ] Buka `/donasi`; di DevTools Network, **tidak ada** request ke `snap.js`
      sebelum tombol "Donasi Sekarang" ditekan.
- [ ] Isi nominal valid lalu klik sekali: popup Snap langsung terbuka tanpa
      refresh/manual reload.
- [ ] Order ID tercatat di halaman status dengan status awal `pending`.
- [ ] Tutup popup: browser menuju `/donasi/status/[orderId]`; status tidak
      berubah akibat aksi client.
- [ ] Ulangi dengan `snap.js` diblokir di DevTools: alur fallback menuju
      `payment.redirectUrl` Midtrans, bukan halaman kosong/spinner.
- [ ] Tombol "Bayar sekarang" di halaman status masih bekerja untuk order
      yang redirect-nya tersimpan.
- [ ] Klik "Donasi Sekarang" dua kali cepat tidak membuat dua order.

## 5. Webhook dan keuangan (Phase 45)

- [ ] Webhook dengan signature salah ditolak, tetap tercatat di log audit, dan
      tidak mengubah status donasi.
- [ ] Satu notifikasi `settlement` menambah income **tepat sekali**.
- [ ] Replay notifikasi yang sama tidak mendouble income.
- [ ] Donasi `pending`/`cancel` tidak ikut dihitung sebagai pemasukan.
- [ ] Laporan publik tidak menampilkan email/telepon; donatur anonim tampil
      sebagai `Anonim`.
- [ ] Small-value QRIS live dijalankan hanya setelah sandbox lolos dan
      mendapat persetujuan pemilik program.

## 6. Aksesibilitas dan performa pasca-deploy (Phase 50–51)

- [ ] Skip link aktif dengan keyboard di halaman publik.
- [ ] Error validasi donasi terbaca dan terhubung ke field terkait.
- [ ] Pesan status pembayaran diumumkan pembaca layar.
- [ ] Logo dimuat lewat `/_next/image`, bukan file besar mentah.
- [ ] Halaman landing tetap benar setelah pergantian siklus Jumat: cache
      maksimal 60 detik, countdown tidak terjebak pada siklus lama.

## 7. Catat evidence

Catat tanpa secret: commit id, waktu, command yang dijalankan, status code, dan
nama check yang lulus. Gunakan file operator-local untuk detail server; format
ringkas ada di `PRODUCTION_CHECKLIST.md` bagian 16. Jangan menyimpan hasil
smoke berisi domain internal, IP, atau token di repository publik.

## 8. Rollback

- Jika popup Snap gagal tetapi redirect bekerja, alur sudah fallback dengan
      sendiri; catat temuan dan perbaiki konfigurasi client key.
- Jika build baru bermasalah secara umum, rollback ke commit sebelumnya,
      jalankan lagi deploy, lalu ulangi checklist dari bagian 2.

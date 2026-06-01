# Live Provider Smoke Runbook — Stable MVP Launch

Dokumen ini checklist eksekusi live smoke untuk Phase 45 (`Stable MVP Launch Validation`) sebelum keputusan launch tag stabil.

## Scope

Wajib dieksekusi:
- Midtrans live QRIS + webhook settlement.
- Telegram public channel broadcast (`/broadcast_laporan`).
- WhatsApp live template send.
- Backup/restore evidence production.

Output akhir:
- Bukti pass/fail per item.
- Owner + impact untuk item fail.
- Keputusan `go-live` atau `hold`.

---

## 1) Pre-flight (Wajib sebelum smoke)

1. Pastikan app production sehat:
   - `GET /` => `200`
   - `GET /laporan` => `200`
   - Admin login bisa.
2. Pastikan env production sudah real value (bukan placeholder):
   - Midtrans: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION=true`
   - Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ADMIN_CHAT_IDS`, `TELEGRAM_PUBLIC_CHANNEL_ID`
   - WhatsApp: `WHATSAPP_ENABLED=true`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_*`
   - App: `NEXT_PUBLIC_APP_URL` benar domain production
3. Pastikan tidak ada secret tampil di response body/log publik.

Stop jika pre-flight gagal.

---

## 2) Midtrans Live QRIS Smoke

## Tujuan
Validasi alur real payment: create donation -> pending -> webhook valid -> `settlement`.

## Langkah
1. Buka `/donasi` production.
2. Buat donasi nominal kecil (mis. Rp1.000 / minimum allowed).
3. Pastikan payment page/QRIS Midtrans live terbuka.
4. Selesaikan pembayaran.
5. Verifikasi internal:
   - Donation awal `pending`.
   - Webhook Midtrans masuk dengan signature valid.
   - Status berubah ke `settlement`.
   - `paidAt` terisi.
6. Ulang kirim webhook settlement yang sama (atau trigger status check aman):
   - Tidak boleh ada efek double income.

## Bukti minimal
- `order_id`.
- Timestamp webhook.
- Before/after status donation.
- Potongan log valid signature.

## Pass criteria
- Settlement sukses dan idempotent.
- Tidak ada regresi privacy/financial rule.

---

## 3) Telegram Public Channel Smoke

## Tujuan
Validasi command `/broadcast_laporan` bisa publish ke channel publik.

## Prasyarat
- `TELEGRAM_PUBLIC_CHANNEL_ID` format `-100...`.
- Bot sudah admin channel dan punya izin post.

## Langkah
1. Dari chat admin allowlist, jalankan `/broadcast_laporan`.
2. Verifikasi bot reply sukses di chat admin.
3. Verifikasi pesan muncul di channel publik target.
4. Verifikasi isi pesan aman:
   - Tidak ada email donor.
   - Tidak ada phone donor.

## Bukti minimal
- Screenshot/tautan message channel.
- Timestamp command.

## Pass criteria
- Pesan terkirim ke channel benar, isi aman.

---

## 4) WhatsApp Live Template Smoke

## Tujuan
Validasi pengiriman template WhatsApp production berjalan.

## Langkah
1. Gunakan endpoint/admin flow reminder yang sudah ada (dry-run dulu jika perlu).
2. Lakukan 1 kirim real ke nomor uji internal yang diizinkan.
3. Verifikasi provider response sukses.
4. Verifikasi pesan diterima di device target.
5. Verifikasi fallback aman:
   - Jika provider gagal, app tidak crash.
   - Error tercatat untuk audit/ops.

## Bukti minimal
- Message ID provider.
- Nomor target dimask di laporan bukti.
- Timestamp kirim/terima.

## Pass criteria
- Template terkirim sukses minimal 1x end-to-end.

---

## 5) Backup/Restore Evidence Production

## Tujuan
Buktikan backup harian valid + restore drill bisa baca data penting.

## Langkah
1. Jalankan/manual trigger backup production sesuai runbook backup.
2. Verifikasi file backup baru terbentuk.
3. Verifikasi checksum `OK`.
4. Jalankan restore drill ke container/db sementara.
5. Jalankan query verifikasi minimal tabel:
   - `users`
   - `donations`
   - `expenses`
6. Hapus resource restore sementara setelah verifikasi.

## Bukti minimal
- Nama file backup + timestamp.
- Hasil checksum.
- Hasil query count restore drill.

## Pass criteria
- Backup valid, restore drill sukses, cleanup selesai.

---

## 6) Keputusan Launch

Gunakan matriks ini:

- **Go-live** jika:
  - Semua smoke pass, atau
  - Ada issue minor non-critical dengan mitigasi jelas.

- **Hold launch** jika ada blocker:
  - Payment settlement tidak reliable.
  - Privacy leak.
  - Financial double-count risk.
  - Telegram/WhatsApp requirement bisnis wajib tapi gagal total.
  - Backup/restore evidence gagal.

Catat di `IMPLEMENTATION_PLAN.md`:
- Hasil pass/fail per item.
- Owner, impact, ETA per blocker.
- Keputusan final (`go-live`/`hold`).

---

## 7) Template Hasil Eksekusi

```txt
Tanggal:
Operator:
Environment:

[Midtrans Live QRIS]
Status: PASS/FAIL
Evidence:
Notes:

[Telegram Broadcast]
Status: PASS/FAIL
Evidence:
Notes:

[WhatsApp Template]
Status: PASS/FAIL
Evidence:
Notes:

[Backup/Restore]
Status: PASS/FAIL
Evidence:
Notes:

Final Decision: GO-LIVE / HOLD
Blockers (if any):
- ...
```

# Live Provider Smoke Operator Checklist

## Pre-flight
- [ ] `GET /` => `200`
- [ ] `GET /laporan` => `200`
- [ ] Admin login sukses
- [ ] Env production inti valid, bukan placeholder

## Telegram
- [ ] Jalankan `/broadcast_laporan`
- [ ] Bot reply sukses
- [ ] Pesan muncul di channel publik
- [ ] Tidak ada email/phone donor

## WhatsApp
- [ ] Kirim 1 template ke nomor internal
- [ ] Provider response sukses
- [ ] Pesan diterima di device target

## Backup / Restore
- [ ] Backup baru terbentuk
- [ ] Checksum `OK`
- [ ] Restore drill sukses
- [ ] Query `users`, `donations`, `expenses` valid
- [ ] Cleanup selesai

## Midtrans
- [ ] Buat donasi live nominal kecil
- [ ] QRIS page terbuka
- [ ] Status awal `pending`
- [ ] Webhook valid masuk
- [ ] Status akhir `settlement`
- [ ] Idempotency aman, tidak double count

## Final
- [ ] Isi `docs/LIVE_PROVIDER_SMOKE_RESULTS_TEMPLATE.md`
- [ ] Tentukan `GO-LIVE` / `HOLD`
- [ ] Update `IMPLEMENTATION_PLAN.md`

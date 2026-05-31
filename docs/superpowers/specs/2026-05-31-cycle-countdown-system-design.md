# Cycle Countdown System Design

Date: 2026-05-31
Status: Draft for review

## 1. Goal

Ganti label periode statis pada dashboard admin dan landing page publik dengan countdown siklus real-time.

Siklus tetap didefinisikan sebagai:
- mulai: Jumat 00:00:00 WIB
- berakhir: Kamis 23:59:59 WIB

Saat countdown habis, sistem harus otomatis pindah ke siklus berikutnya tanpa aksi manual admin. Target minggu lalu di-copy ke siklus baru. Progress dana ikut berpindah secara natural karena perhitungan donasi selalu mengikuti rentang siklus aktif.

## 2. Problem Summary

Saat ini sistem punya dua masalah utama:

1. Dashboard admin masih menampilkan teks statis `Periode YYYY-MM-DD s.d. YYYY-MM-DD` pada kartu target siklus. Ini informatif, tapi tidak memberi sense of urgency.
2. Landing page publik menampilkan info siklus dua kali:
   - di hero aside: `Siklus berjalan` + label periode + `% terkumpul`
   - di section `Target Minggu Ini`: periode + progress target

Dampak:
- informasi siklus terpecah
- urgency donasi lemah
- hierarki informasi landing page kurang efektif
- perpindahan siklus masih implicit, belum terasa otomatis

## 3. Product Decisions

Keputusan final hasil brainstorming:

- Countdown menghitung ke **Kamis 23:59:59 WIB**.
- Saat countdown habis, sistem **langsung pindah** ke siklus baru.
- Sistem **auto-copy target nominal** dari siklus sebelumnya ke siklus baru.
- Landing page publik ikut menampilkan countdown.
- Telegram public broadcast dikirim otomatis saat siklus berganti.
- Landing page memakai pendekatan **A**:
  - hero aside tetap fokus ke KPI finansial
  - section target di bawah jadi tempat utama countdown + progress
- Countdown visual memakai **segmented boxes**: Hari | Jam | Menit | Detik.
- Saat siklus berganti, landing page menampilkan badge kecil `Siklus baru dimulai` selama 24 jam.

## 4. Scope

### In scope

- Update model data siklus agar deadline eksplisit dan mudah dikonsumsi UI.
- Tambah utilitas countdown untuk admin dan publik.
- Ganti label periode statis dengan countdown pada dashboard admin.
- Rapikan landing page agar info siklus tidak tampil ganda.
- Tambah auto-transition job untuk copy target ke siklus berikutnya.
- Tambah Telegram broadcast untuk transisi siklus.
- Tambah state `siklus baru dimulai` untuk landing page publik.

### Out of scope

- Mengubah definisi siklus Jumat→Kamis.
- Menambah recurring donation.
- Menambah workflow approval baru saat target gagal tercapai.
- Mengubah rumus progress dana.
- Mendesain ulang seluruh landing page di luar area hero aside dan target progress.

## 5. Desired UX

## 5.1 Admin dashboard

Kartu `Target Siklus Jumat` tetap ada di dashboard admin.

Perubahan:
- hapus teks statis `Periode ...`
- tampilkan countdown segmented boxes
- countdown update real-time di client
- target, terkumpul, sisa, progress bar tetap dipertahankan
- saat siklus berganti, dashboard otomatis menampilkan siklus baru setelah reload/refresh data

Catatan UX:
- admin perlu tahu sisa waktu operasional sebelum belanja Kamis
- countdown harus terbaca cepat, bukan dekoratif
- angka memakai tabular figures agar tidak goyang saat update

## 5.2 Landing page publik

Landing page saat ini redundan. Setelah perubahan:

### Hero aside

Tetap fokus ke:
- pemasukan siklus
- pengeluaran siklus
- saldo program
- persen terkumpul

Yang dihapus dari hero aside:
- label periode siklus yang redundan

### Section target progress

Section ini jadi pusat info siklus publik:
- badge `Target Minggu Ini`
- headline progress
- countdown segmented boxes: Hari | Jam | Menit | Detik
- progress bar
- target / terkumpul / status
- badge kecil `Siklus baru dimulai` selama 24 jam pertama setelah transisi

Tujuan:
- satu tempat utama untuk urgency donasi
- hero tetap bersih
- target progress lebih jelas dan tidak pecah ke dua area

## 5.3 Saat countdown habis

Perilaku publik dan admin:
- countdown lama selesai di Kamis 23:59:59 WIB
- data siklus aktif berganti ke Jumat berikutnya
- target baru sudah tersedia hasil copy dari siklus lama
- donasi terkumpul untuk siklus baru dihitung dari settlement dalam rentang baru
- landing page menampilkan badge `Siklus baru dimulai`
- tidak ada dead state atau layar kosong

## 5.4 Telegram broadcast

Saat siklus berganti, sistem kirim broadcast publik berisi:
- ringkasan siklus lama
- target lama
- total terkumpul
- persentase tercapai
- info siklus baru
- target siklus baru
- periode siklus baru
- link donasi

Format copy final dapat menyesuaikan gaya kanal Telegram existing, tetapi semua poin isi di atas wajib tetap ada.

## 6. Architecture

Solusi dibagi jadi 4 lapisan:

1. **Cycle time utilities**
   - hitung rentang siklus aktif
   - hitung deadline countdown
   - hitung apakah sedang dalam 24 jam awal siklus baru

2. **Weekly target transition service**
   - cek apakah target siklus baru sudah ada
   - copy target siklus sebelumnya jika belum ada
   - jaga idempotency agar job aman di-run berulang

3. **Presentation layer**
   - komponen countdown bersama untuk admin dan landing
   - landing page target section redesign ringan
   - admin card update

4. **Automation layer**
   - scheduled job / cron
   - transition service
   - Telegram broadcast

## 7. Data and Domain Design

## 7.1 Existing cycle model

Saat ini sistem sudah punya:
- `getCurrentFridayCycleRange(now)`
- `WeeklyTarget` dengan `cycleStart` dan `cycleEnd`
- `getWeeklyTargetProgress()` yang menghitung target aktif dan donasi settlement dalam rentang siklus

Ini fondasi cukup. Tidak perlu ubah definisi inti.

## 7.2 Needed cycle metadata

UI countdown perlu metadata baru dari server layer:
- `deadlineAt`: timestamp Kamis 23:59:59 WIB untuk siklus aktif
- `cycleLabel`: tetap tersedia untuk fallback / tooltip / debug
- `isNewCycle`: boolean untuk 24 jam pertama setelah transisi
- `newCycleStartedAt`: timestamp awal siklus aktif bila perlu untuk badge timing

Rekomendasi bentuk object:

```ts
export type CycleCountdownMeta = {
  cycleStart: string;
  cycleEnd: string;
  cycleLabel: string;
  deadlineAtIso: string;
  isNewCycle: boolean;
};
```

## 7.3 Target copy rules

Saat job transisi jalan:
- cari siklus sebelumnya
- ambil target minggu lalu jika ada
- buat target baru untuk `cycleStart` Jumat baru jika belum ada
- nominal target dan note di-copy apa adanya
- `createdBy` bisa memakai sistem user / job actor sesuai pola existing audit

Jika target lama tidak ada:
- sistem tidak membuat target kosong paksa
- siklus baru tetap aktif
- UI tetap menampilkan `Belum diatur`
- broadcast publik dapat menyesuaikan isi jika target baru tidak ada

## 7.4 Progress carry-over behavior

User meminta progress ikut pindah. Secara domain, ini tidak berarti menyalin angka terkumpul ke DB baru. Yang benar:
- progress selalu dihitung dari donasi settlement dalam rentang siklus aktif
- setelah siklus berganti, progress otomatis membaca settlement pada rentang baru
- jika belum ada donasi baru, progress = 0
- jika sudah ada settlement dalam siklus baru, progress langsung ikut angka baru itu

Jadi tidak ada copy nilai `collected`. Hanya perhitungan aktif yang berpindah.

## 8. UI Component Design

## 8.1 Shared countdown component

Buat komponen reusable, misalnya:

```ts
<CycleCountdown
  deadlineAtIso={progress.cycle.deadlineAtIso}
  variant="admin"
/>
```

Tanggung jawab:
- hitung selisih waktu client-side tiap detik
- tampilkan 4 segmen: Hari, Jam, Menit, Detik
- clamp ke nol bila lewat deadline
- support hydration aman
- support `aria-live` yang tidak berisik

Format visual:
- 4 kotak sejajar pada desktop
- wrap 2x2 pada mobile bila ruang sempit
- angka besar, label kecil uppercase
- angka memakai kelas numeric/tabular

## 8.2 Admin card changes

Pada kartu `Target Siklus Jumat`:
- ganti baris `Periode {progress.cycle.label}` dengan block countdown
- tetap sisakan label periode kecil di secondary text atau tooltip bila dibutuhkan
- target/terkumpul/sisa tetap sama

Hierarchy:
1. judul kartu
2. badge persen
3. countdown
4. progress bar
5. target / terkumpul / sisa
6. note bila ada

## 8.3 Landing target section changes

Section target publik diubah jadi pusat urgency.

Struktur baru:
- badge `Target Minggu Ini`
- headline tetap atau disederhanakan
- subcopy pendek: target aktif + urgency donasi
- segmented countdown prominent
- badge `Siklus baru dimulai` bila `isNewCycle = true`
- progress bar
- stat cards: target / terkumpul / status

Section ini tidak perlu lagi menulis `Sisa X hari menuju Jumat berikutnya` karena countdown sudah lebih kuat dan presisi.

## 8.4 Landing hero aside changes

Hero aside tetap dipakai untuk KPI finansial. Rapikan:
- hapus label periode di kanan atas
- pertahankan badge `Siklus berjalan` sebagai konteks ringan
- `% terkumpul` tetap ada sebagai KPI cepat
- jangan tampilkan countdown kedua di hero aside

Hasil akhir: satu sumber countdown publik, bukan dua.

## 9. Automation Design

## 9.1 Trigger model

Pilih model **hybrid**:
- UI countdown di client untuk pengalaman real-time
- auto-transition dan broadcast dijalankan cron / scheduled job server-side

Alasan:
- tidak bergantung admin membuka dashboard
- reliable untuk broadcast publik
- cocok dengan infra scheduled jobs yang sudah ada

## 9.2 Scheduled job behavior

Job jalan terjadwal mendekati awal siklus baru, praktisnya Jumat 00:00 WIB.

Job steps:
1. hitung siklus aktif saat ini
2. hitung siklus sebelumnya
3. cek apakah `WeeklyTarget` untuk siklus aktif sudah ada
4. jika belum ada dan siklus sebelumnya punya target, copy ke siklus aktif
5. hitung ringkasan pencapaian siklus sebelumnya
6. kirim Telegram public broadcast
7. tandai/log audit agar operasi bisa dilacak

## 9.3 Idempotency

Wajib idempotent.

Karena cron bisa jalan ulang atau retry, service harus aman bila dipanggil berkali-kali.

Aturan:
- copy target hanya jika target siklus aktif belum ada
- broadcast jangan terkirim ganda untuk siklus sama
- simpan jejak bahwa broadcast transisi untuk `cycleStart` tertentu sudah pernah dikirim

Implementasi bisa memakai salah satu pola:
- audit log action unik per cycle
- tabel job state khusus
- notification log khusus public broadcast

Rekomendasi: pakai pola logging yang paling dekat dengan infrastruktur Telegram existing supaya perubahan kecil.

## 10. Error Handling

### UI countdown
- jika client gagal parse timestamp, fallback ke label periode biasa
- jika hydration belum siap, tampilkan placeholder stabil yang tidak berubah sampai client mount selesai

### Transition service
- jika target lama tidak ada, lanjut tanpa copy
- jika Telegram gagal, jangan rollback target baru
- jika broadcast gagal, log error dan biarkan retry policy menangani
- invalid state tidak boleh memblokir perpindahan siklus

### Admin/public pages
- jika metadata countdown tidak tersedia, tampilkan `Periode {label}` sebagai fallback

## 11. Testing Strategy

## 11.1 Unit tests

Tambah test untuk utilitas waktu:
- hitung deadline Kamis 23:59:59 WIB dari berbagai hari
- deteksi `isNewCycle` dalam 24 jam pertama
- clamp countdown ke nol sesudah deadline

Tambah test untuk transition service:
- copy target jika target baru belum ada
- tidak copy dua kali jika target baru sudah ada
- tidak gagal jika target lama tidak ada
- hitung summary siklus lama benar

## 11.2 Integration tests

- scheduled job memanggil transition service sesuai waktu
- Telegram payload berisi target lama, terkumpul, persentase, target baru, periode baru, link donasi
- audit/log idempotency mencegah double broadcast

## 11.3 UI tests

- landing page hanya punya satu countdown siklus utama
- hero aside tidak lagi menampilkan label periode redundant
- admin dashboard menampilkan countdown, bukan teks periode statis
- badge `Siklus baru dimulai` muncul pada window 24 jam awal

## 11.4 Manual QA

Verifikasi:
- mobile landing page: countdown wrap rapi, tidak overflow
- desktop landing page: hierarchy tetap jelas
- admin dashboard: countdown terbaca cepat
- transisi siklus simulasi waktu Kamis malam ke Jumat dini hari
- Telegram message format terbaca baik di channel publik

## 12. File Impact Estimate

File exact bisa berubah, tapi area kerja diperkirakan:

- `src/lib/friday-cycle.ts`
- `src/lib/weekly-target.ts`
- `src/lib/landing.ts`
- `src/app/admin/page.tsx`
- `src/components/landing/landing-hero.tsx`
- `src/components/landing/landing-target-progress.tsx`
- komponen countdown baru bersama, rekomendasi: `src/components/cycle-countdown.tsx`
- scheduled job / telegram service existing yang menangani automation transisi siklus
- test files terkait waktu, weekly target, landing, dan scheduled jobs

## 13. Recommended Implementation Approach

### Approach A — Minimal targeted extension

- tambah metadata countdown ke utilitas siklus existing
- buat shared countdown component kecil
- tambah service copy target + broadcast
- update landing dan admin secara lokal

Kelebihan:
- perubahan kecil
- cepat divalidasi
- paling cocok dengan codebase sekarang

Kekurangan:
- logic transisi bisa tersebar jika boundaries tidak dijaga

### Approach B — Dedicated cycle-transition module

- buat module khusus untuk cycle countdown + transition + broadcast payload
- semua consumer pakai module itu

Kelebihan:
- boundary lebih jelas
- mudah dites

Kekurangan:
- sedikit lebih banyak file dan wiring

### Recommendation

Pakai **Approach B ringan**.

Artinya:
- utilitas waktu tetap di `friday-cycle.ts`
- transition orchestration dipusatkan di module khusus
- UI tetap hanya consume typed metadata

Ini cukup bersih tanpa over-engineering.

## 14. Acceptance Criteria

Fitur dianggap benar bila:

1. Dashboard admin tidak lagi menampilkan teks periode statis sebagai info utama, tetapi countdown real-time ke Kamis 23:59:59 WIB.
2. Landing page publik hanya punya satu area utama untuk info countdown siklus.
3. Hero aside publik tidak lagi menduplikasi label periode siklus.
4. Saat siklus berganti, target minggu lalu otomatis di-copy ke siklus baru bila target baru belum ada.
5. Progress dana pada admin dan publik mengikuti siklus aktif tanpa copy manual angka terkumpul.
6. Sistem mengirim Telegram public broadcast sekali untuk tiap transisi siklus.
7. Retry/job ulang tidak membuat target ganda atau broadcast ganda.
8. Landing page menampilkan badge `Siklus baru dimulai` selama 24 jam pertama setelah transisi.
9. Mobile dan desktop layout countdown tetap rapi.

## 15. Risks and Mitigations

### Risk: timezone salah
Mitigation:
- semua boundary countdown dan transisi diuji eksplisit pada `Asia/Jakarta`
- jangan andalkan timezone server default

### Risk: broadcast ganda
Mitigation:
- pakai idempotency key berbasis cycle start
- log pengiriman yang bisa dicek sebelum kirim ulang

### Risk: hydration mismatch countdown
Mitigation:
- kirim timestamp ISO final dari server
- client hanya hitung delta
- gunakan fallback stabil sebelum mount penuh

### Risk: target lama tidak ada
Mitigation:
- jangan blokir siklus baru
- tampilkan `Belum diatur`
- admin tetap bisa set manual

## 16. Non-Goals Reminder

Fitur ini tidak mengubah:
- sumber kebenaran saldo
- aturan settlement donation
- workflow penyaluran
- struktur laporan publik
- nominal target berdasarkan performa pekan lalu

## 17. Implementation Note

Karena project rules mewajibkan kerja per fase dan plan sebagai source of truth, implementasi fitur ini harus masuk sebagai pekerjaan terencana baru, bukan langsung dicampur ke perubahan acak UI. Setelah spec disetujui user, langkah berikutnya adalah menulis implementation plan dengan scope kecil dan validation cycle jelas.

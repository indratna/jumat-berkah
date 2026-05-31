# Admin Table System Design

Tanggal: 2026-05-31
Status: Draft for Review
Referensi utama: `/admin/donasi`

## 1. Tujuan

Menjadikan `/admin/donasi` sebagai referensi visual, struktur, dan interaksi untuk seluruh halaman admin yang memiliki tabel, agar pengalaman admin terasa sebagai satu sistem tunggal, bukan kumpulan halaman yang dirapikan terpisah.

Target akhir:

- visual tabel admin seragam
- struktur halaman tabel seragam
- interaksi tabel seragam bila relevan
- layering/sticky behavior aman terhadap header admin, notifikasi, modal, dan popover
- page-specific behavior tetap dipertahankan bila memang berbeda kebutuhan

## 2. Scope

Halaman dalam scope, urutan implementasi:

1. `/admin/donatur`
2. `/admin/pengeluaran`
3. `/admin/audit`
4. `/admin/persetujuan`

Halaman referensi:

- `/admin/donasi`

Di luar scope:

- perubahan business logic donasi
- perubahan payment flow Midtrans
- perubahan webhook behavior
- perubahan perhitungan finansial
- redesign total halaman admin non-table
- penggantian arsitektur tabel menjadi framework generik penuh

## 3. Prinsip Desain

Mengacu pada pilihan user: konsistensi ketat, tetapi tetap memakai pendekatan hybrid reusable system.

Prinsip utama:

1. `/admin/donasi` adalah baseline visual dan interaction model.
2. Halaman lain harus terasa “satu keluarga” dengan `/admin/donasi`.
3. Reusable component dipakai untuk tulang punggung layout dan controls, bukan untuk memaksa semua tabel menjadi schema-driven framework besar.
4. Fitur hanya disamakan bila relevan untuk page tersebut.
5. Keterbacaan, kepadatan data, dan stabilitas sticky/layering lebih penting daripada dekorasi.

## 4. Pendekatan yang Dipilih

Pendekatan final: **Hybrid reusable system**.

Artinya:

- layout inti, shell tabel, footer, action button, dan beberapa utility sticky/z-index akan dijadikan reusable
- kolom tabel, isi row, empty state spesifik, dan interaksi khusus page tetap berada di page masing-masing
- tidak membangun “table engine” besar yang memaksa semua halaman ke abstraction berat

Alasan pemilihan:

- menjaga konsistensi kuat
- aman untuk codebase existing
- cukup fleksibel untuk page hybrid seperti `/admin/persetujuan`
- menurunkan risiko bug berulang dari copy-paste visual

## 5. Standard Visual yang Harus Seragam

Semua halaman tabel admin dalam scope harus mengikuti standard berikut.

### 5.1 Container dan spacing

- gunakan lebar konten utama yang konsisten, mengikuti pola `max-w-6xl`
- vertical spacing antar blok mengikuti ritme yang sama seperti `/admin/donasi`
- padding card, toolbar, dan footer konsisten

### 5.2 Header halaman

- gunakan sticky page bar bila halaman memang punya toolbar/actions penting
- visual sticky header mengikuti pola `/admin/donasi`: card putih, border halus, rounded besar, shadow ringan
- title, subtitle singkat, dan cluster action ada dalam hierarki yang konsisten

### 5.3 Card tabel

- shell tabel memakai card putih dengan border `slate-200`, radius `2xl`, shadow ringan
- section order konsisten:
  1. sticky page bar / page heading
  2. toolbar filter/search
  3. table area / data area
  4. footer meta + pagination

### 5.4 Table header

- sticky thead saat relevan
- uppercase label kecil dengan tracking halus
- background header lembut seperti `/admin/donasi`
- shadow/border bawah header konsisten agar row tidak visually collide saat scroll

### 5.5 Table body

- text size, padding row, alignment, dan border row konsisten
- data padat tetap readable
- angka dan nominal menjaga alignment yang rapi
- row action zone tidak terasa terlalu ramai

### 5.6 Footer tabel

- total/page info diletakkan di footer, bukan tersebar di banyak tempat
- pagination controls seragam
- page size selector tetap boleh ada bila memang dibutuhkan dan mengikuti pola sama

### 5.7 Action buttons

- tombol aksi kecil/compact
- hierarchy jelas antara primary, neutral, dan destructive
- style konsisten lintas halaman
- file export atau external navigation tidak memakai Next client route bila responsnya file/binary

## 6. Standard Interaksi yang Harus Seragam

### 6.1 Sorting

- sorting di header kolom dipakai bila page memang memiliki list yang relevan untuk diurutkan
- visual state aktif/inaktif sorting harus sama
- jika page tidak mendukung sorting tertentu, kolom tetap non-sortable secara jelas, tanpa affordance palsu

### 6.2 Filtering dan search

- toolbar filter/search berada di atas tabel
- struktur field ringkas dan predictable
- grid responsif tetap seragam meski isi filter berbeda

### 6.3 Sticky behavior

- sticky page bar, sticky table header, dan sticky admin shell header harus memakai aturan top offset dan z-index yang terkontrol
- tidak boleh menutupi notification popover, modal, dropdown, atau tooltip
- tidak boleh menciptakan nested-scroll aneh bila page memang seharusnya hanya punya satu scroll utama

### 6.4 Popover, dropdown, modal

- semua popover/dropdown di area admin table harus punya layering di atas sticky header/table
- outside click close dan `Escape` close harus dipakai saat relevan
- behavior ini harus konsisten, bukan ad-hoc per halaman

### 6.5 Empty / loading / error state

- empty state text, spacing, dan emphasis seragam
- loading dan error state wajib tetap jelas untuk halaman data-heavy
- tidak boleh ada page yang terasa “rusak” hanya karena belum ada data

## 7. Reusable Building Blocks

Komponen/shared pattern yang direncanakan:

### 7.1 `AdminDataPageShell`

Tanggung jawab:

- wrapper `main`
- max width
- spacing antar section
- slot untuk sticky page bar dan content card

### 7.2 `AdminStickyPageBar`

Tanggung jawab:

- sticky top behavior di bawah admin shell header
- title/subtitle/action alignment
- standard visual card untuk page bar

Catatan:

- dipakai pada page yang memang butuh action bar persisten
- page sederhana boleh tidak memakai sticky variant, tetapi visual style tetap sama

### 7.3 `AdminTableCard`

Tanggung jawab:

- outer table card visual shell
- standard border, radius, shadow
- optional slots untuk toolbar, body, footer

### 7.4 `AdminTableFooter`

Tanggung jawab:

- total meta
- page info
- pagination cluster
- optional page-size control pattern

### 7.5 `AdminTableActionButton`

Tanggung jawab:

- compact action button styling
- semantic variant (neutral / primary / danger / export)
- icon/text spacing konsisten

### 7.6 Shared utility/tokens

- sticky top offset helper
- z-index rules
- common table head cell class pattern
- common row density class pattern
- shared export button pattern

## 8. Page-by-Page Adaptation Strategy

### 8.1 `/admin/donatur`

Target:

- migrasi pertama karena paling dekat dengan `/admin/donasi`
- samakan sticky page bar, toolbar spacing, card shell, footer, action buttons
- pertahankan fitur modal/detail/edit/merge donor yang sudah ada
- jika sticky thead cocok, aktifkan dengan aturan yang sama seperti `/admin/donasi`

### 8.2 `/admin/pengeluaran`

Target:

- daftar pengeluaran mengikuti shell dan toolbar standar
- footer meta/pagination diseragamkan
- `ExpenseManager` action buttons dirapikan ke pattern sama
- preview import CSV ikut “dialek visual” sama, meski bukan tabel utama

Catatan:

- preview import tidak harus sticky seperti tabel utama, tetapi visual language harus sama

### 8.3 `/admin/audit`

Target:

- fokus keterbacaan data padat
- shell, footer, toolbar, sticky behavior, dan row hierarchy ikut standar yang sama
- expand/detail row tetap boleh dipertahankan bila memang penting untuk audit readability

### 8.4 `/admin/persetujuan`

Target:

- walau hybrid monitoring page, visual dan interaction shell harus tetap terasa satu sistem
- bagian list/table mengikuti table standards sejauh relevan
- jika ada area yang bukan tabel murni, tetap memakai page shell dan card grammar yang sama

## 9. Accessibility dan UX Guardrails

Semua perubahan harus memenuhi guardrails berikut:

- focus state tetap terlihat
- icon-only button wajib punya label/aria-label
- touch target cukup besar untuk klik aman
- sorting affordance jelas
- color bukan satu-satunya penanda status
- sticky layers tidak menghalangi interaksi penting
- no horizontal scroll yang tidak perlu di mobile
- no nested scroll yang membingungkan

## 10. Technical Guardrails

- jangan ubah query/filter/business logic kecuali perlu untuk menyelaraskan presentational structure
- jangan ubah payment/webhook logic
- jangan pindahkan behavior ke abstraction besar bila membuat debugging lebih sulit
- reusable layer harus kecil, jelas, dan fokus pada presentational consistency
- page tetap boleh punya renderer lokal untuk kolom/row/detail interaction

## 11. Validation Strategy

Untuk tiap page yang dimigrasi:

1. lint file yang diubah
2. type/build sanity bila perubahan lintas shared component cukup besar
3. manual browser check pada:
   - sticky page bar
   - sticky thead
   - pagination/footer alignment
   - popover/dropdown/modal layering
   - responsive width dan single-scroll behavior
4. cek visual parity terhadap `/admin/donasi`

## 12. Success Criteria

Desain ini dianggap berhasil bila:

- `/admin/donatur`, `/admin/pengeluaran`, `/admin/audit`, dan `/admin/persetujuan` terasa berasal dari satu design system yang sama
- admin dapat berpindah halaman tanpa harus belajar ulang pola toolbar/footer/action
- layering bugs seperti popover tertutup sticky header tidak muncul lagi karena z-index rules diseragamkan
- perubahan dilakukan tanpa merusak logic bisnis halaman masing-masing
- codebase lebih rapi karena struktur inti dibagi ke reusable layer secukupnya

## 13. Explicit Non-Goals

- tidak membuat data-table framework generik penuh
- tidak memaksakan semua halaman memiliki export
- tidak memaksakan semua halaman punya sorting pada semua kolom
- tidak mendesain ulang shell admin secara total
- tidak mengubah copy bisnis di luar kebutuhan kerapian UI

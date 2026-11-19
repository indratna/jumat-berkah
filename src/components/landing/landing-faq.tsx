const items = [
  {
    question: "Apa itu Jumat Berkah Karyo?",
    answer:
      "Program sosial internal kantor untuk menyediakan nasi Jumat bagi masjid di sekitar kantor. Donasi dikumpulkan secara digital, lalu dipakai memasak dan menyalurkan nasi setiap pekan.",
  },
  {
    question: "Bagaimana cara berdonasi?",
    answer:
      "Pilih nominal, isi nama atau pilih anonim, lalu lanjutkan ke pembayaran QRIS. Tidak perlu membuat akun atau login. Setelah pembayaran berhasil, status donasi diperbarui otomatis.",
  },
  {
    question: "Berapa nominal minimum donasi?",
    answer:
      "Nominal minimum Rp1.000. Anda bisa memilih nominal cepat Rp10.000, Rp25.000, Rp50.000, atau Rp100.000, atau mengisi nominal lain sesuai keinginan.",
  },
  {
    question: "Bagaimana saya tahu donasi berhasil?",
    answer:
      "Halaman status donasi akan berubah menjadi berhasil setelah pembayaran diterima. Simpan Order ID yang tampil sebagai bukti. Jangan pernah membagikan data kontak pribadi di ruang publik.",
  },
  {
    question: "Kapan laporan dan cerita penyaluran terbit?",
    answer:
      "Laporan publik mengikuti siklus Jumat sampai Kamis. Ringkasan dana diperbarui setelah pembayaran berhasil dan pengeluaran disetujui, sedangkan cerita penyaluran terbit setelah admin mempublikasikannya.",
  },
  {
    question: "Apakah saya perlu akun atau login?",
    answer:
      "Tidak perlu. Donasi bisa dilakukan tanpa akun atau login. Setelah pembayaran, simpan Order ID untuk mengecek status donasi kapan saja.",
  },
  {
    question: "Bagaimana cara cek status donasi tanpa akun?",
    answer:
      "Buka halaman Cek status donasi, lalu masukkan Order ID yang tampil setelah pembayaran. Status juga diperbarui otomatis di halaman status tanpa perlu memuat ulang.",
  },
  {
    question: "Apakah nominal donasi ditambah kode unik?",
    answer:
      "Tidak. Nominal yang tampil di laporan adalah nominal pembayaran yang berhasil diterima, tanpa biaya tambahan atau kode unik. Pembayaran resmi hanya lewat QRIS Midtrans.",
  },
  {
    question: "Bagaimana cara menghubungi admin?",
    answer:
      "Gunakan tombol WhatsApp admin di halaman ini. Sertakan Order ID jika bertanya tentang donasi tertentu.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export function LandingFaq() {
  return (
    <section
      id="faq"
      className="craft-card-strong p-6 sm:p-8"
      aria-labelledby="faq-title"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="craft-pill">Pertanyaan Umum</span>
          <h2
            id="faq-title"
            className="mt-3 text-2xl font-bold leading-tight sm:text-3xl"
          >
            Hal yang sering ditanyakan donatur.
          </h2>
        </div>
      </header>
      <div className="mt-6 divide-y divide-[color:var(--craft-line)]">
        {items.map((item) => (
          <details
            key={item.question}
            className="group py-1 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-lg py-3 text-left text-base font-bold text-[color:var(--craft-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--craft-amber)]">
              <span>{item.question}</span>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-5 shrink-0 text-[color:var(--craft-leaf)] transition group-open:rotate-45 motion-reduce:transition-none"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </summary>
            <p className="mb-4 mt-1 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
const items = [
  {
    question: "Apa itu Jumat Berkah Karyo?",
    answer:
      "Program internal kantor untuk menyediakan nasi Jumat ke masjid sekitar. Donasi dikumpulkan secara digital dan dipakai memasak nasi setiap pekan.",
  },
  {
    question: "Bagaimana donasi disalurkan?",
    answer:
      "Setiap minggu admin memasak nasi sesuai dana yang masuk lalu mendistribusikannya ke masjid. Cerita penyaluran dibagikan di laporan siklus.",
  },
  {
    question: "Apakah donatur perlu login?",
    answer:
      "Tidak wajib. Donatur publik bisa langsung donasi via QRIS. Login opsional jika ingin melihat riwayat donasi pribadi.",
  },
  {
    question: "Bagaimana laporan dicek?",
    answer:
      "Buka halaman Laporan untuk melihat pemasukan, pengeluaran, dan saldo siklus berjalan secara terbuka.",
  },
];

export function LandingFaq() {
  return (
    <section className="craft-card-strong p-6 sm:p-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="craft-pill">Pertanyaan Umum</span>
          <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
            Hal yang sering ditanyakan donatur.
          </h2>
        </div>
      </header>
      <div className="mt-6 divide-y divide-[color:var(--craft-line)]">
        {items.map((item) => (
          <details
            key={item.question}
            className="group py-4 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-base font-bold text-[color:var(--craft-ink)]">
              <span>{item.question}</span>
              <svg
                viewBox="0 0 24 24"
                className="size-5 shrink-0 text-[color:var(--craft-leaf)] transition group-open:rotate-45"
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
            <p className="mt-3 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

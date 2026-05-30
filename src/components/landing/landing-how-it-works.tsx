const steps = [
  {
    title: "Pilih nominal donasi",
    description: "Tanpa wajib login, isi sesuai keinginan.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 1v22" />
        <path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" />
      </svg>
    ),
  },
  {
    title: "Bayar via QRIS",
    description: "Sistem buat transaksi Midtrans dan tampilkan QRIS.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3z" />
        <path d="M21 21h-4" />
        <path d="M21 17v4" />
      </svg>
    ),
  },
  {
    title: "Status terupdate otomatis",
    description: "Webhook Midtrans memperbarui status & laporan publik.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-3.51-7.13" />
        <path d="M21 4v5h-5" />
      </svg>
    ),
  },
];

export function LandingHowItWorks() {
  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <span className="craft-pill">Cara Berdonasi</span>
          <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
            Tiga langkah ringkas, tidak perlu login.
          </h2>
        </div>
        <p className="text-sm text-[color:var(--craft-ink-soft)] sm:max-w-xs">
          Dirancang sederhana supaya donatur bisa langsung berdonasi dalam
          hitungan menit.
        </p>
      </header>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="craft-card relative flex flex-col gap-4 p-6"
          >
            <div className="flex items-center justify-between">
              <span className="craft-num text-5xl italic text-[color:var(--craft-leaf)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="rounded-full border border-[color:var(--craft-line)] p-2 text-[color:var(--craft-leaf)]">
                {step.icon}
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-[color:var(--craft-ink)]">
                {step.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--craft-ink-soft)]">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const items = [
  {
    title: "Laporan publik terbuka",
    description:
      "Pemasukan, pengeluaran, dan saldo program bisa dilihat siapa saja tanpa perlu akun.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 3v18h18" />
        <path d="M7 14l3-3 4 4 5-7" />
      </svg>
    ),
  },
  {
    title: "Privasi donatur dilindungi",
    description:
      "Email dan nomor WhatsApp tidak pernah ditampilkan di laporan publik. Nama hanya tampil jika donatur mengizinkannya; donatur anonim tampil sebagai Anonim.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: "Audit lengkap di sisi admin",
    description:
      "Setiap perubahan dana dan persetujuan pengeluaran tercatat di audit log internal.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    ),
  },
];

export function LandingTransparency() {
  return (
    <section className="space-y-6" aria-labelledby="transparansi-title">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <span className="craft-pill">Transparansi</span>
          <h2
            id="transparansi-title"
            className="mt-3 text-2xl font-bold leading-tight sm:text-3xl"
          >
            Dana publik dijaga secara terbuka.
          </h2>
        </div>
        <p className="text-sm leading-6 text-[color:var(--craft-ink-soft)] sm:max-w-xs">
          Setiap transaksi tercatat dan dapat ditelusuri tanpa mengorbankan
          privasi donatur.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.title}
            className="craft-card flex flex-col gap-3 p-5"
          >
            <span className="grid size-9 place-items-center rounded-full border border-[color:var(--craft-line)] text-[color:var(--craft-leaf)]">
              {item.icon}
            </span>
            <p className="text-base font-bold text-[color:var(--craft-ink)]">
              {item.title}
            </p>
            <p className="text-sm leading-6 text-[color:var(--craft-ink-soft)]">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
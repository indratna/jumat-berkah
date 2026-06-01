import Link from "next/link";

const adminWhatsApp = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP?.trim() ?? "";
const adminWhatsAppMessage =
  "Assalamualaikum admin, saya mau tanya soal Jumat Berkah Karyo";
const hasAdminWhatsApp = adminWhatsApp.length > 0;
const adminWhatsAppHref = hasAdminWhatsApp
  ? `https://wa.me/${adminWhatsApp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(adminWhatsAppMessage)}`
  : null;

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="overflow-hidden rounded-3xl bg-[color:var(--craft-leaf-strong)] text-[color:var(--craft-cream)]">
      <div className="grid gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <span className="craft-pill bg-[color:var(--craft-cream-strong)]/20 text-[color:var(--craft-cream)]">
            Jumat Berkah Karyo
          </span>
          <p className="text-base leading-7 text-[color:var(--craft-cream)]/80">
            Program donasi sosial internal kantor. Setiap rupiah dipakai
            langsung untuk penyaluran nasi Jumat ke masjid sekitar kantor.
          </p>
          <p className="text-xs text-[color:var(--craft-cream)]/60">
            Kontak donatur disimpan privat. Hanya admin internal yang melihat
            data operasional.
          </p>
        </div>
        <FooterColumn
          title="Donatur"
          links={[
            { href: "/donasi", label: "Donasi" },
            { href: "/laporan", label: "Laporan" },
            { href: "/tentang", label: "Tentang program" },
          ]}
        />
        <FooterColumn
          title="Dukungan"
          links={[
            { href: "/laporan?period=jumat", label: "Cerita penyaluran" },
            { href: "/akun/donasi", label: "Riwayat donasi" },
            { href: "/masuk", label: "Masuk donatur" },
          ]}
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--craft-cream)]/60">
            Kontak Admin
          </p>
          <div className="mt-3 text-sm font-semibold">
            {adminWhatsAppHref ? (
              <a
                href={adminWhatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[color:var(--craft-amber)]"
              >
                WhatsApp Admin
              </a>
            ) : (
              <span className="text-[color:var(--craft-cream)]/70">
                Hubungi admin
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-[color:var(--craft-cream)]/15 px-6 py-4 text-xs text-[color:var(--craft-cream)]/65 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <p>© {year} Jumat Berkah Karyo. Semua donasi dipakai untuk program.</p>
        <p>Jumat Berkah: Donasi Mudah, Laporan Terbuka.</p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--craft-cream)]/60">
        {title}
      </p>
      <ul className="mt-3 space-y-2 text-sm font-semibold">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="hover:text-[color:var(--craft-amber)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

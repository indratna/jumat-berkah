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
    <footer className="overflow-hidden rounded-3xl bg-[#14432d] text-[#f7f1e6]">
      <div className="grid gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <span className="inline-flex items-center rounded-full border border-[#f7f1e6]/25 bg-[#f7f1e6]/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#f7f1e6]">
            Jumat Berkah Karyo
          </span>
          <p className="text-base leading-7 text-[#f7f1e6]/90">
            Program donasi sosial internal kantor. Setiap rupiah dipakai
            langsung untuk penyaluran nasi Jumat ke masjid sekitar kantor.
          </p>
          <p className="text-xs leading-5 text-[#f7f1e6]/85">
            Email dan nomor WhatsApp donatur tidak pernah ditampilkan di laporan
            publik. Hanya admin internal yang melihat data operasional.
          </p>
        </div>
        <FooterColumn
          title="Donatur"
          links={[
            { href: "/donasi", label: "Donasi" },
            { href: "/laporan", label: "Laporan publik" },
            { href: "/donasi/status", label: "Cek status donasi" },
          ]}
        />
        <FooterColumn
          title="Program"
          links={[
            { href: "/#cara-berdonasi", label: "Cara berdonasi" },
            { href: "/laporan?period=jumat", label: "Cerita penyaluran" },
            { href: "/tentang", label: "Tentang program" },
          ]}
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#f7f1e6]/85">
            Kontak Admin
          </p>
          <div className="mt-1 text-sm font-semibold">
            {adminWhatsAppHref ? (
              <a
                href={adminWhatsAppHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center hover:text-[#e0a458]"
              >
                WhatsApp Admin
              </a>
            ) : (
              <span className="inline-flex min-h-11 items-center text-[#f7f1e6]/85">
                Hubungi admin
              </span>
            )}
          </div>
          <p className="text-xs leading-5 text-[#f7f1e6]/85">
            Sertakan Order ID jika bertanya tentang donasi tertentu.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 border-t border-[#f7f1e6]/20 px-6 py-4 text-xs text-[#f7f1e6]/85 sm:flex-row sm:items-center sm:justify-between sm:px-10">
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
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#f7f1e6]/85">
        {title}
      </p>
      <ul className="mt-1 space-y-1 text-sm font-semibold">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-11 items-center hover:text-[#e0a458]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
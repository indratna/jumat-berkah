"use client";

import { usePathname } from "next/navigation";

const adminWhatsApp = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP?.trim() ?? "";
const adminWhatsAppMessage =
  "Assalamualaikum admin, saya mau tanya soal Jumat Berkah Karyo";
const adminWhatsAppHref = adminWhatsApp
  ? `https://wa.me/${adminWhatsApp.replace(/[^\d]/g, "")}?text=${encodeURIComponent(adminWhatsAppMessage)}`
  : null;

function isPublicPath(pathname: string) {
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/akun")) return false;
  if (pathname.startsWith("/api")) return false;
  return true;
}

export function PublicFloatingWhatsApp() {
  const pathname = usePathname();

  if (!adminWhatsAppHref || !isPublicPath(pathname)) {
    return null;
  }

  return (
    <a
      href={adminWhatsAppHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hubungi admin via WhatsApp"
      className="group fixed left-4 top-1/2 z-50 inline-flex -translate-y-1/2 items-center gap-2 rounded-full bg-emerald-600 px-2.5 py-2 text-sm font-bold text-white shadow-xl ring-1 ring-emerald-500/70 transition hover:-translate-y-[52%] hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
    >
      <span
        className="grid size-8 place-items-center rounded-full bg-white text-emerald-600"
        aria-hidden
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M20.52 3.48A11.8 11.8 0 0 0 12.12 0C5.52 0 .12 5.4.12 12c0 2.1.54 4.2 1.62 6L0 24l6.18-1.62A11.9 11.9 0 0 0 12.12 24c6.6 0 12-5.4 12-12 0-3.18-1.26-6.18-3.6-8.52zm-8.4 18.48c-1.86 0-3.66-.48-5.22-1.44l-.36-.18-3.66.96.96-3.54-.24-.36a9.9 9.9 0 0 1-1.56-5.4c0-5.4 4.38-9.9 9.9-9.9 2.64 0 5.16 1.02 7.02 2.94a9.87 9.87 0 0 1 2.88 6.96c0 5.46-4.44 9.96-9.72 9.96zm5.46-7.44c-.3-.18-1.74-.84-2.04-.96-.24-.12-.42-.18-.6.12-.18.3-.72.96-.9 1.2-.18.18-.3.24-.6.06-.3-.18-1.26-.48-2.4-1.56-.9-.78-1.5-1.8-1.68-2.1-.18-.3 0-.42.12-.6.12-.12.3-.3.42-.48.12-.18.18-.3.3-.48.06-.18 0-.36 0-.48 0-.12-.6-1.5-.84-2.04-.24-.6-.42-.48-.6-.48h-.54c-.18 0-.48.06-.72.3-.24.24-.96.9-.96 2.22 0 1.32.96 2.58 1.08 2.76.12.18 1.86 2.94 4.56 4.08.6.3 1.14.48 1.5.6.66.18 1.26.18 1.74.12.54-.06 1.74-.72 1.98-1.44.24-.72.24-1.26.18-1.44-.12-.12-.3-.18-.6-.36z" />
        </svg>
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:max-w-40 group-hover:opacity-100 group-focus-visible:max-w-40 group-focus-visible:opacity-100">
        Hubungi admin
      </span>
    </a>
  );
}

import localFont from "next/font/local";
import type { Metadata, Viewport } from "next";

import "./globals.css";
import { PublicFloatingWhatsApp } from "@/components/public-floating-whatsapp";

const display = localFont({
  src: [
    {
      path: "./fonts/plus-jakarta-sans-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/plus-jakarta-sans-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/plus-jakarta-sans-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/plus-jakarta-sans-latin-800-normal.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

const body = localFont({
  src: [
    {
      path: "./fonts/inter-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/inter-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/inter-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/inter-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const siteDescription =
  "Donasi nasi Jumat untuk masjid sekitar kantor lewat QRIS. Laporan pemasukan, pengeluaran, dan penyaluran terbuka untuk siapa saja.";

export const metadata: Metadata = {
  metadataBase: safeUrl(siteUrl),
  title: {
    default: "Jumat Berkah Karyo — Donasi Nasi Jumat via QRIS",
    template: "%s | Jumat Berkah Karyo",
  },
  description: siteDescription,
  applicationName: "Jumat Berkah Karyo",
  keywords: [
    "donasi Jumat Berkah",
    "nasi Jumat",
    "donasi QRIS",
    "laporan donasi transparan",
    "sedekah kantor",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "/",
    siteName: "Jumat Berkah Karyo",
    title: "Jumat Berkah Karyo — Donasi Nasi Jumat via QRIS",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "Jumat Berkah Karyo — Donasi Nasi Jumat via QRIS",
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f1e6",
  colorScheme: "light",
};

function safeUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    // A malformed env value must not break metadata rendering.
    return new URL("http://localhost:3000");
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#main-content">
          Lewati ke konten utama
        </a>
        {children}
        <PublicFloatingWhatsApp />
      </body>
    </html>
  );
}

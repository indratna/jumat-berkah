import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jumat Berkah",
  description: "Aplikasi donasi Jumat Berkah via QRIS dan laporan transparan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <a className="skip-link" href="#main-content">
          Lewati ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}

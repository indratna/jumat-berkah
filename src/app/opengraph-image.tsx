import { ImageResponse } from "next/og";

export const alt =
  "Jumat Berkah Karyo — donasi nasi Jumat untuk masjid sekitar kantor";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #f7f1e6 0%, #ede3cc 100%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "#1f5d3f",
              color: "#f7f1e6",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            JB
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#7a4a14",
            }}
          >
            Jumat Berkah Karyo
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -2,
              color: "#0f2a1f",
              maxWidth: 900,
            }}
          >
            Sediakan nasi Jumat untuk masjid sekitar kantor.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              lineHeight: 1.4,
              color: "rgba(15, 42, 31, 0.72)",
              maxWidth: 860,
            }}
          >
            Donasi via QRIS, status otomatis, laporan terbuka untuk siapa saja.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderRadius: 999,
              padding: "14px 28px",
              background: "#1f5d3f",
              color: "#f7f1e6",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            Donasi Mudah, Laporan Terbuka
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderRadius: 999,
              padding: "14px 28px",
              background: "rgba(224, 164, 88, 0.3)",
              color: "#0f2a1f",
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            Mulai Rp1.000
          </div>
        </div>
      </div>
    ),
    size,
  );
}
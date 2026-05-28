import { NextResponse } from "next/server";

import { getCurrentFridayCycleRange } from "@/lib/friday-cycle";
import { buildFridayCycleReportPdf, buildPublicReportCsv } from "@/lib/report-export";
import { getPublicReport } from "@/lib/reports";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "pdf";
  const cycle = getCurrentFridayCycleRange();
  const report = await getPublicReport({ from: cycle.from, to: cycle.to });

  if (format === "csv") {
    const csv = buildPublicReportCsv(report);
    return new Response(csv, {
      headers: {
        "Content-Disposition": `attachment; filename="laporan-jumat-berkah-${cycle.fromDate}-${cycle.toDate}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  }

  if (format !== "pdf") {
    return NextResponse.json(
      { errors: { format: "Format export tidak didukung." } },
      { status: 400 },
    );
  }

  const pdf = buildFridayCycleReportPdf({ report, generatedAt: new Date() });
  return new Response(pdf, {
    headers: {
      "Content-Disposition": `attachment; filename="laporan-jumat-berkah-${cycle.fromDate}-${cycle.toDate}.pdf"`,
      "Content-Type": "application/pdf",
    },
  });
}

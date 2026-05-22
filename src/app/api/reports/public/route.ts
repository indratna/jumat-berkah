import { NextResponse } from "next/server";

import { getPublicReport, parseReportDateRange } from "@/lib/reports";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = parseReportDateRange(url.searchParams);
  const report = await getPublicReport(range);

  return NextResponse.json(report);
}

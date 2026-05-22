import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import { getAdminReportExport } from "@/lib/admin";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const admin = await requireAdminUser(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!admin) {
    return NextResponse.json({ errors: { auth: "Unauthorized" } }, { status: 401 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const csv = await getAdminReportExport({ from, to });
  const filename = buildExportFilename(from, to);

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}

function buildExportFilename(from: string | null, to: string | null) {
  const suffix = [from, to].filter(Boolean).join("_");
  return suffix ? `laporan-jumat-berkah-${suffix}.csv` : "laporan-jumat-berkah.csv";
}

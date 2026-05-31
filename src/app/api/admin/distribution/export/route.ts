import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { formatAdminDate, formatAdminDateOnly } from "@/lib/admin";
import { buildAdminDistributionPdf } from "@/lib/admin-distribution-pdf";
import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";
import { getPrisma } from "@/lib/db";
import {
  type DistributionReportRecord,
  listDistributionReports,
} from "@/lib/distribution-report";

export async function GET(request: Request) {
  const admin = await getAdminFromCookie();

  if (!admin) {
    return NextResponse.json(
      { errors: { auth: "Unauthorized" } },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "csv";
  const status = normalizeStatus(url.searchParams.get("status"));
  const q = normalizeString(url.searchParams.get("q"));

  const allReports = await listDistributionReports(10_000);
  const reports = allReports.filter((report) => matchesFilters(report, { status, q }));
  const prisma = getPrisma();

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "distribution_report.exported",
      entityType: "distribution_report",
      entityId: "admin-distribution-export",
      before: Prisma.JsonNull,
      after: {
        format,
        status,
        q,
        total: reports.length,
      },
    },
  });

  if (format === "pdf") {
    return new Response(
      buildAdminDistributionPdf({
        reports,
        total: reports.length,
        filters: { status, q },
      }),
      {
        headers: {
          "Content-Disposition": 'attachment; filename="cerita-penyaluran.pdf"',
          "Content-Type": "application/pdf",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const csv = buildDistributionCsv(reports);
  return new Response(`\ufeff${csv}`, {
    headers: {
      "Content-Disposition": 'attachment; filename="cerita-penyaluran.csv"',
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function getAdminFromCookie() {
  const cookieStore = await cookies();
  const legacyAdmin = await requireAdminUser(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  return legacyAdmin ?? requireBetterAuthAdminUser(await headers());
}

function normalizeString(value: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeStatus(value: string | null) {
  return value === "published" || value === "draft" ? value : null;
}

function matchesFilters(
  report: DistributionReportRecord,
  filters: { status: "published" | "draft" | null; q: string | null },
) {
  if (filters.status === "published" && !report.publishedAt) {
    return false;
  }

  if (filters.status === "draft" && report.publishedAt) {
    return false;
  }

  if (!filters.q) {
    return true;
  }

  const haystack = [report.title, report.summary, report.locationSummary ?? ""]
    .join(" ")
    .toLowerCase();
  return haystack.includes(filters.q.toLowerCase());
}

function buildDistributionCsv(reports: DistributionReportRecord[]) {
  const rows = [
    [
      "cycle_start",
      "cycle_label",
      "title",
      "summary",
      "package_count",
      "location_summary",
      "photo_count",
      "photo_urls",
      "status",
      "published_at",
      "created_at",
      "updated_at",
    ],
    ...reports.map((report) => [
      report.cycleStart.toISOString().slice(0, 10),
      formatAdminDateOnly(report.cycleStart),
      report.title,
      report.summary,
      report.packageCount !== null ? String(report.packageCount) : "",
      report.locationSummary ?? "",
      String(report.photoUrls.length),
      report.photoUrls.join(" | "),
      report.publishedAt ? "published" : "draft",
      report.publishedAt ? formatAdminDate(report.publishedAt) : "",
      formatAdminDate(report.createdAt),
      formatAdminDate(report.updatedAt),
    ]),
  ];

  return `${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n")}\n`;
}

function escapeCsvCell(value: string) {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

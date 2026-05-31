import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";
import { getPrisma } from "@/lib/db";
import {
  type AdminSortDirection,
  type DonorSortField,
  getAdminDonors,
  normalizePage,
  normalizePageSize,
} from "@/lib/admin";
import { buildAdminDonorPdf } from "@/lib/admin-donor-pdf";

const donorSortFields = new Set<DonorSortField>([
  "lastDonationAt",
  "totalSettlementAmount",
  "settlementCount",
  "name",
]);

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
  const filters = {
    q: url.searchParams.get("q"),
    activity: url.searchParams.get("activity"),
    label: url.searchParams.get("label"),
    page: normalizePage(1),
    pageSize: normalizePageSize(10_000),
    sort: getDonorSort(url.searchParams.get("sort")),
    direction: getSortDirection(url.searchParams.get("direction")),
    selectedKey: null,
  };
  const donors = await getAdminDonors(filters);
  const prisma = getPrisma();

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "donor.exported",
      entityType: "donor_profile",
      entityId: "admin-donor-export",
      before: Prisma.JsonNull,
      after: {
        q: filters.q,
        activity: filters.activity,
        label: filters.label,
        sort: filters.sort,
        direction: filters.direction,
        total: donors.total,
        format,
      },
    },
  });

  if (format === "pdf") {
    const pdf = buildAdminDonorPdf({
      donors: donors.items,
      total: donors.total,
      filters: {
        q: filters.q,
        activity: filters.activity,
        label: filters.label,
      },
    });

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="donatur.pdf"',
        "Cache-Control": "no-store",
      },
    });
  }

  const csv = buildDonorCsv(donors.items);
  return new Response(`\ufeff${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="donatur.csv"',
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

function buildDonorCsv(
  donors: Awaited<ReturnType<typeof getAdminDonors>>["items"],
) {
  const rows = [
    [
      "donor_key",
      "nama",
      "email",
      "whatsapp",
      "labels",
      "catatan",
      "consent_wa",
      "total_settlement",
      "jumlah_settlement",
      "jumlah_donasi",
      "donasi_pertama",
      "donasi_terakhir",
    ],
    ...donors.map((donor) => [
      donor.key,
      donor.name,
      donor.email ?? "",
      formatPhoneForExcel(donor.phone),
      donor.labels.join("; "),
      donor.internalNote ?? "",
      donor.whatsappReminderOptIn ? "opt-in" : "belum opt-in",
      String(donor.totalSettlementAmount),
      String(donor.settlementCount),
      String(donor.donationCount),
      donor.firstDonationAt?.toISOString() ?? "",
      donor.lastDonationAt?.toISOString() ?? "",
    ]),
  ];

  return `${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n")}\n`;
}

function formatPhoneForExcel(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return `="${trimmed.replaceAll('"', '""')}"`;
}

function escapeCsvCell(value: string) {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

function getSortDirection(value: string | null): AdminSortDirection {
  return value === "asc" ? "asc" : "desc";
}

function getDonorSort(value: string | null): DonorSortField {
  return value && donorSortFields.has(value as DonorSortField)
    ? (value as DonorSortField)
    : "lastDonationAt";
}

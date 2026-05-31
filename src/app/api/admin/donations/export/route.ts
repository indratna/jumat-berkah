import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { buildAdminDonationPdf } from "@/lib/admin-donation-pdf";
import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";
import { getPrisma } from "@/lib/db";
import {
  type AdminSortDirection,
  type DonationSortField,
  formatAdminDate,
  getAdminDonations,
  getAdminDonorName,
  normalizePage,
  normalizePageSize,
} from "@/lib/admin";

const donationSortFields = new Set<DonationSortField>([
  "createdAt",
  "paidAt",
  "amount",
  "status",
  "orderId",
  "donorName",
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
  const format = url.searchParams.get("format") ?? "csv";
  const filters = {
    status: url.searchParams.get("status"),
    q: url.searchParams.get("q"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
    page: normalizePage(1),
    pageSize: normalizePageSize(10_000),
    sort: getDonationSort(url.searchParams.get("sort")),
    direction: getSortDirection(url.searchParams.get("direction")),
  };
  const donations = await getAdminDonations(filters);
  const filename = buildFilename(filters.from, filters.to, format);
  const prisma = getPrisma();

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "donation.exported",
      entityType: "donation",
      entityId: "admin-donation-export",
      before: Prisma.JsonNull,
      after: {
        format,
        status: filters.status,
        q: filters.q,
        from: filters.from,
        to: filters.to,
        sort: filters.sort,
        direction: filters.direction,
        total: donations.total,
      },
    },
  });

  if (format === "csv") {
    const csv = buildDonationCsv(donations.items);
    return new Response(`\ufeff${csv}`, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  if (format === "pdf") {
    return new Response(
      buildDonationPdf({
        donations: donations.items,
        total: donations.total,
        filters: {
          status: filters.status,
          q: filters.q,
          from: filters.from,
          to: filters.to,
        },
      }),
      {
        headers: {
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Type": "application/pdf",
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return NextResponse.json(
    { errors: { format: "Format export tidak didukung." } },
    { status: 400 },
  );
}

async function getAdminFromCookie() {
  const cookieStore = await cookies();
  const legacyAdmin = await requireAdminUser(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  return legacyAdmin ?? requireBetterAuthAdminUser(await headers());
}

function buildDonationCsv(
  donations: Awaited<ReturnType<typeof getAdminDonations>>["items"],
) {
  const rows = [
    [
      "order_id",
      "donatur",
      "email",
      "whatsapp",
      "nominal",
      "status",
      "metode",
      "dibuat",
      "dibayar",
      "pesan",
    ],
    ...donations.map((donation) => [
      donation.orderId,
      getAdminDonorName(donation),
      donation.donorEmail ?? "",
      formatPhoneForExcel(donation.donorPhone),
      String(donation.amount),
      donation.status,
      donation.paymentMethod,
      formatAdminDate(donation.createdAt),
      donation.paidAt ? formatAdminDate(donation.paidAt) : "",
      donation.message ?? "",
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

  // Excel/LibreOffice treat values like 6281234567890 as numbers and switch
  // them to scientific notation. Wrapping with a leading `=` plus quoted text
  // pins the cell as a literal string regardless of column type detection.
  return `="${trimmed.replaceAll('"', '""')}"`;
}

function buildDonationPdf(input: {
  donations: Awaited<ReturnType<typeof getAdminDonations>>["items"];
  total: number;
  filters: {
    status: string | null;
    q: string | null;
    from: string | null;
    to: string | null;
  };
}) {
  return buildAdminDonationPdf(input);
}

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function buildFilename(from: string | null, to: string | null, format: string) {
  const suffix = [from, to].filter(Boolean).join("_");
  const extension = format === "pdf" ? "pdf" : "csv";
  return suffix ? `donasi-${suffix}.${extension}` : `donasi.${extension}`;
}

function getSortDirection(value: string | null): AdminSortDirection {
  return value === "asc" ? "asc" : "desc";
}

function getDonationSort(value: string | null): DonationSortField {
  return value && donationSortFields.has(value as DonationSortField)
    ? (value as DonationSortField)
    : "createdAt";
}

import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";
import { getPrisma } from "@/lib/db";
import {
  type AdminSortDirection,
  type DonationSortField,
  formatAdminDate,
  formatRupiah,
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
    return new Response(buildDonationCsv(donations.items), {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  if (format === "pdf") {
    return new Response(buildDonationPdf(donations.items), {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
      },
    });
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
      donation.donorPhone ?? "",
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

function buildDonationPdf(
  donations: Awaited<ReturnType<typeof getAdminDonations>>["items"],
) {
  const lines = [
    "Export Donasi Admin",
    `Dibuat: ${formatAdminDate(new Date())}`,
    `Total baris: ${donations.length}`,
    "",
    ...donations
      .slice(0, 45)
      .map((donation) =>
        [
          donation.orderId,
          getAdminDonorName(donation),
          formatRupiah(donation.amount),
          donation.status,
          formatAdminDate(donation.createdAt),
        ].join(" - "),
      ),
  ];

  return buildSimplePdf(lines);
}

function buildSimplePdf(lines: string[]) {
  const content = [
    "BT",
    "/F1 10 Tf",
    "40 790 Td",
    "12 TL",
    ...lines.flatMap((line, index) => {
      const text = `(${escapePdfText(line.slice(0, 112))}) Tj`;
      return index === 0 ? [text] : ["T*", text];
    }),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function escapePdfText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
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

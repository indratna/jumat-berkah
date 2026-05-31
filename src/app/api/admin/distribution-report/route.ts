import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";
import { getPrisma } from "@/lib/db";
import {
  deleteDistributionReport,
  getDistributionReportById,
  upsertDistributionReport,
  validateDistributionReportInput,
} from "@/lib/distribution-report";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const legacyAdmin = await requireAdminUser(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  const admin =
    legacyAdmin ?? (await requireBetterAuthAdminUser(await headers()));

  if (!admin) {
    return NextResponse.json(
      { errors: { auth: "Unauthorized" } },
      { status: 401 },
    );
  }

  const payload = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const validation = validateDistributionReportInput(payload ?? {});

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const prisma = getPrisma();
  const previous = await prisma.distributionReport.findUnique({
    where: { cycleStart: validation.data.cycleStart },
  });

  const report = await upsertDistributionReport({
    cycleStart: validation.data.cycleStart,
    title: validation.data.title,
    summary: validation.data.summary,
    packageCount: validation.data.packageCount,
    locationSummary: validation.data.locationSummary,
    photoUrls: validation.data.photoUrls,
    publish: validation.data.publish,
    createdBy: admin.id,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: previous
        ? "distribution_report.updated"
        : "distribution_report.created",
      entityType: "distribution_report",
      entityId: report.id,
      before: previous
        ? {
            id: previous.id,
            cycleStart: previous.cycleStart.toISOString().slice(0, 10),
            title: previous.title,
            summary: previous.summary,
            packageCount: previous.packageCount ?? null,
            locationSummary: previous.locationSummary ?? null,
            photoUrls: Array.isArray(previous.photoUrls)
              ? (previous.photoUrls as unknown as string[])
              : [],
            publishedAt: previous.publishedAt?.toISOString() ?? null,
          }
        : Prisma.JsonNull,
      after: {
        id: report.id,
        cycleStart: report.cycleStart.toISOString().slice(0, 10),
        title: report.title,
        summary: report.summary,
        packageCount: report.packageCount,
        locationSummary: report.locationSummary,
        photoUrls: report.photoUrls,
        publishedAt: report.publishedAt?.toISOString() ?? null,
      },
    },
  });

  return NextResponse.json({
    id: report.id,
    cycleStart: report.cycleStart.toISOString().slice(0, 10),
    title: report.title,
    summary: report.summary,
    packageCount: report.packageCount,
    locationSummary: report.locationSummary,
    photoUrls: report.photoUrls,
    publishedAt: report.publishedAt?.toISOString() ?? null,
  });
}

export async function DELETE(request: Request) {
  const admin = await getAdminFromHeadersAndCookies();

  if (!admin) {
    return NextResponse.json(
      { errors: { auth: "Unauthorized" } },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();

  if (!id) {
    return NextResponse.json(
      { errors: { id: "ID cerita wajib diisi." } },
      { status: 400 },
    );
  }

  const existing = await getDistributionReportById(id);

  if (!existing) {
    return NextResponse.json(
      { errors: { report: "Cerita penyaluran tidak ditemukan." } },
      { status: 404 },
    );
  }

  await deleteDistributionReport(id);

  const prisma = getPrisma();
  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "distribution_report.deleted",
      entityType: "distribution_report",
      entityId: id,
      before: {
        id: existing.id,
        cycleStart: existing.cycleStart.toISOString().slice(0, 10),
        title: existing.title,
        summary: existing.summary,
        packageCount: existing.packageCount,
        locationSummary: existing.locationSummary,
        photoUrls: existing.photoUrls,
        publishedAt: existing.publishedAt?.toISOString() ?? null,
      },
      after: Prisma.JsonNull,
    },
  });

  return NextResponse.json({ ok: true });
}

async function getAdminFromHeadersAndCookies() {
  const cookieStore = await cookies();
  const legacyAdmin = await requireAdminUser(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  return legacyAdmin ?? requireBetterAuthAdminUser(await headers());
}

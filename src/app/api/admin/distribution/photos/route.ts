import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";
import { getPrisma } from "@/lib/db";
import {
  buildDistributionPhotoFilename,
  getDistributionPhotoExtensionFromMime,
  validateDistributionPhotoFile,
} from "@/lib/distribution-photo-upload";
import { matchesExpectedExtension } from "@/lib/file-signature";

const PUBLIC_PATH = "/uploads/distribution";

export async function POST(request: Request) {
  const admin = await getAdminFromCookie();

  if (!admin) {
    return NextResponse.json(
      { errors: { auth: "Unauthorized" } },
      { status: 401 },
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { errors: { file: "File foto wajib diunggah." } },
      { status: 400 },
    );
  }

  const validation = validateDistributionPhotoFile(file);

  if (!validation.success) {
    return NextResponse.json(
      { errors: { file: validation.error } },
      { status: 400 },
    );
  }

  const extension = getDistributionPhotoExtensionFromMime(file.type);

  if (!extension) {
    return NextResponse.json(
      { errors: { file: "Format foto harus JPG, PNG, atau WebP." } },
      { status: 400 },
    );
  }

  const randomId = randomUUID();
  const filename = buildDistributionPhotoFilename({
    originalName: `photo.${extension}`,
    randomId,
  });
  const dir = path.join(process.cwd(), "public", "uploads", "distribution");
  const filePath = path.join(dir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());

  // The browser's MIME type is attacker-controlled; verify the real bytes.
  if (!matchesExpectedExtension(bytes, extension)) {
    return NextResponse.json(
      { errors: { file: "Isi file tidak sesuai dengan format yang diklaim." } },
      { status: 400 },
    );
  }

  await mkdir(dir, { recursive: true });
  await writeFile(filePath, bytes);

  const url = `${PUBLIC_PATH}/${filename}`;
  const prisma = getPrisma();

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "distribution_report.photo_uploaded",
      entityType: "distribution_report_photo",
      entityId: filename,
      before: Prisma.JsonNull,
      after: { url, size: file.size, type: file.type },
    },
  });

  return NextResponse.json({ url });
}

async function getAdminFromCookie() {
  const cookieStore = await cookies();
  const legacyAdmin = await requireAdminUser(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  return legacyAdmin ?? requireBetterAuthAdminUser(await headers());
}

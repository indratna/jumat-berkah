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
  buildExpenseReceiptFilename,
  getExpenseReceiptExtensionFromMime,
  validateExpenseReceiptFile,
} from "@/lib/expense-receipt-upload";

const RECEIPT_PUBLIC_PATH = "/uploads/receipts";

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
      { errors: { file: "File bukti wajib diunggah." } },
      { status: 400 },
    );
  }

  const validation = validateExpenseReceiptFile(file);

  if (!validation.success) {
    return NextResponse.json(
      { errors: { file: validation.error } },
      { status: 400 },
    );
  }

  const extension = getExpenseReceiptExtensionFromMime(file.type);

  if (!extension) {
    return NextResponse.json(
      { errors: { file: "Format bukti harus JPG, PNG, WebP, atau PDF." } },
      { status: 400 },
    );
  }

  const randomId = randomUUID();
  const filename = buildExpenseReceiptFilename({
    originalName: `receipt.${extension}`,
    randomId,
  });
  const uploadDirectory = path.join(
    process.cwd(),
    "public",
    "uploads",
    "receipts",
  );
  const uploadPath = path.join(uploadDirectory, filename);
  const bytes = Buffer.from(await file.arrayBuffer());

  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(uploadPath, bytes);

  const receiptUrl = `${RECEIPT_PUBLIC_PATH}/${filename}`;
  const prisma = getPrisma();

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "expense.receipt_uploaded",
      entityType: "expense_receipt",
      entityId: filename,
      before: Prisma.JsonNull,
      after: {
        receiptUrl,
        size: file.size,
        type: file.type,
      },
    },
  });

  return NextResponse.json({ receiptUrl });
}

async function getAdminFromCookie() {
  const cookieStore = await cookies();
  const legacyAdmin = await requireAdminUser(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value,
  );
  return legacyAdmin ?? requireBetterAuthAdminUser(await headers());
}

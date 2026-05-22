import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import {
  getReceiptSignedUrlSecret,
  verifySignedReceiptUrl,
} from "@/lib/receipt-storage";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const admin = await requireAdminUser(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  if (!admin) {
    return NextResponse.json(
      { errors: { auth: "Admin wajib login." } },
      { status: 401 },
    );
  }

  const secret = getReceiptSignedUrlSecret();
  if (!secret) {
    return NextResponse.json(
      { errors: { config: "Receipt signed URL secret belum dikonfigurasi." } },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const objectKey = url.searchParams.get("key");
  const expires = Number(url.searchParams.get("expires"));
  const signature = url.searchParams.get("signature");

  if (!objectKey || !Number.isInteger(expires) || !signature) {
    return NextResponse.json(
      { errors: { query: "Parameter receipt tidak valid." } },
      { status: 400 },
    );
  }

  const valid = verifySignedReceiptUrl({
    objectKey,
    expires,
    signature,
    secret,
    now: new Date(),
  });

  if (!valid) {
    return NextResponse.json(
      { errors: { signature: "Signed URL receipt tidak valid atau kedaluwarsa." } },
      { status: 403 },
    );
  }

  return NextResponse.json({
    ok: true,
    objectKey,
    message:
      "Signed URL valid. Hubungkan route ini ke R2/S3 private object fetch saat storage produksi tersedia.",
  });
}

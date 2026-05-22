import { NextResponse } from "next/server";

import {
  createDonorSession,
  DONOR_SESSION_COOKIE,
  getDonorSessionMaxAge,
} from "@/lib/auth";
import { getPrisma } from "@/lib/db";

type DonorLoginPayload = {
  name?: unknown;
  email?: unknown;
  loginCode?: unknown;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as DonorLoginPayload | null;
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  const loginCode = typeof payload?.loginCode === "string" ? payload.loginCode : "";
  const expectedLoginCode = process.env.DONOR_LOGIN_CODE;

  if (!expectedLoginCode) {
    return NextResponse.json(
      { errors: { auth: "DONOR_LOGIN_CODE belum dikonfigurasi." } },
      { status: 500 },
    );
  }

  if (!name || !email || !isValidEmail(email)) {
    return NextResponse.json(
      { errors: { auth: "Nama dan email donatur wajib valid." } },
      { status: 400 },
    );
  }

  if (!loginCode || loginCode !== expectedLoginCode) {
    return NextResponse.json(
      { errors: { auth: "Kode donatur tidak valid." } },
      { status: 401 },
    );
  }

  const prisma = getPrisma();
  const donor = await prisma.user.upsert({
    where: { email },
    update: { name },
    create: { email, name, role: "donor" },
    select: { id: true, email: true, role: true },
  });

  if (donor.role !== "donor") {
    return NextResponse.json(
      { errors: { auth: "Email ini tidak dapat dipakai sebagai akun donatur." } },
      { status: 403 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: DONOR_SESSION_COOKIE,
    value: createDonorSession({ userId: donor.id, email: donor.email }),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: getDonorSessionMaxAge(),
    path: "/",
  });

  return response;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

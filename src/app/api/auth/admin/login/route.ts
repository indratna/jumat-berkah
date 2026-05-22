import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  getAdminSessionMaxAge,
} from "@/lib/auth";
import { getPrisma } from "@/lib/db";

type LoginPayload = {
  email?: unknown;
  loginCode?: unknown;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as LoginPayload | null;
  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  const loginCode = typeof payload?.loginCode === "string" ? payload.loginCode : "";
  const expectedLoginCode = process.env.ADMIN_LOGIN_CODE;

  if (!expectedLoginCode) {
    return NextResponse.json(
      { errors: { auth: "ADMIN_LOGIN_CODE belum dikonfigurasi." } },
      { status: 500 },
    );
  }

  if (!email || !loginCode || loginCode !== expectedLoginCode) {
    return NextResponse.json(
      { errors: { auth: "Email atau kode admin tidak valid." } },
      { status: 401 },
    );
  }

  const prisma = getPrisma();
  const admin = await prisma.user.findUnique({
    where: { email },
    select: { email: true, role: true },
  });

  if (!admin || admin.role !== "admin") {
    return NextResponse.json(
      { errors: { auth: "Akun admin tidak ditemukan." } },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSession(admin.email),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: getAdminSessionMaxAge(),
    path: "/",
  });

  return response;
}

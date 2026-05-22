import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const DONOR_SESSION_COOKIE = "donor_session";

const SESSION_TTL_SECONDS = 60 * 60 * 8;
const DONOR_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type AdminSessionPayload = {
  email: string;
  role: "admin";
  expiresAt: number;
};

type DonorSessionPayload = {
  userId: string;
  email: string;
  role: "donor";
  expiresAt: number;
};

export function createAdminSession(email: string) {
  const payload: AdminSessionPayload = {
    email,
    role: "admin",
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signSessionPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function createDonorSession(input: { userId: string; email: string }) {
  const payload: DonorSessionPayload = {
    userId: input.userId,
    email: input.email,
    role: "donor",
    expiresAt: Math.floor(Date.now() / 1000) + DONOR_SESSION_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signSessionPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSession(session: string | undefined) {
  if (!session) {
    return null;
  }

  const [encodedPayload, signature] = session.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signSessionPayload(encodedPayload);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  const payload = parseSessionPayload(encodedPayload);

  if (!payload || payload.role !== "admin" || payload.expiresAt < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export function verifyDonorSession(session: string | undefined) {
  if (!session) {
    return null;
  }

  const [encodedPayload, signature] = session.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signSessionPayload(encodedPayload);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  const payload = parseDonorSessionPayload(encodedPayload);

  if (!payload || payload.role !== "donor" || payload.expiresAt < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export async function requireAdminUser(session: string | undefined) {
  const payload = verifyAdminSession(session);

  if (!payload) {
    return null;
  }

  const { getPrisma } = await import("@/lib/db");
  const prisma = getPrisma();

  return prisma.user.findFirst({
    where: { email: payload.email, role: "admin" },
    select: { id: true, email: true, role: true },
  });
}

export async function getDonorUser(session: string | undefined) {
  const payload = verifyDonorSession(session);

  if (!payload) {
    return null;
  }

  const { getPrisma } = await import("@/lib/db");
  const prisma = getPrisma();

  return prisma.user.findFirst({
    where: { id: payload.userId, email: payload.email, role: "donor" },
    select: { id: true, name: true, email: true, role: true },
  });
}

export function getAdminSessionMaxAge() {
  return SESSION_TTL_SECONDS;
}

export function getDonorSessionMaxAge() {
  return DONOR_SESSION_TTL_SECONDS;
}

function signSessionPayload(encodedPayload: string) {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required for admin session signing.");
  }

  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function parseSessionPayload(encodedPayload: string): AdminSessionPayload | null {
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as unknown;

    if (!isAdminSessionPayload(payload)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function parseDonorSessionPayload(encodedPayload: string): DonorSessionPayload | null {
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as unknown;

    if (!isDonorSessionPayload(payload)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function isAdminSessionPayload(payload: unknown): payload is AdminSessionPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "email" in payload &&
    "role" in payload &&
    "expiresAt" in payload &&
    typeof payload.email === "string" &&
    payload.role === "admin" &&
    typeof payload.expiresAt === "number"
  );
}

function isDonorSessionPayload(payload: unknown): payload is DonorSessionPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "userId" in payload &&
    "email" in payload &&
    "role" in payload &&
    "expiresAt" in payload &&
    typeof payload.userId === "string" &&
    typeof payload.email === "string" &&
    payload.role === "donor" &&
    typeof payload.expiresAt === "number"
  );
}

function safeEqual(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer);
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

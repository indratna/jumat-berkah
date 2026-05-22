import { NextRequest, NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "admin_session";

type ProxyAdminSessionPayload = {
  role: "admin";
  expiresAt: number;
};

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const isAuthenticated = await verifyAdminSession(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
  );

  if (isAuthenticated) {
    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json({ errors: { auth: "Unauthorized" } }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

async function verifyAdminSession(session: string | undefined) {
  if (!session) {
    return false;
  }

  const [encodedPayload, signature] = session.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = await signSessionPayload(encodedPayload);

  if (signature !== expectedSignature) {
    return false;
  }

  const payload = parsePayload(encodedPayload);

  return Boolean(
    payload && payload.role === "admin" && payload.expiresAt >= Math.floor(Date.now() / 1000),
  );
}

async function signSessionPayload(encodedPayload: string) {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    return "";
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload),
  );

  return base64UrlEncode(new Uint8Array(signature));
}

function parsePayload(encodedPayload: string) {
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as unknown;

    if (isAdminSessionPayload(payload)) {
      return payload;
    }

    return null;
  } catch {
    return null;
  }
}

function isAdminSessionPayload(payload: unknown): payload is ProxyAdminSessionPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "role" in payload &&
    "expiresAt" in payload &&
    payload.role === "admin" &&
    typeof payload.expiresAt === "number"
  );
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const base64 = padded.replaceAll("-", "+").replaceAll("_", "/");

  return atob(base64);
}

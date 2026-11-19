import { NextRequest, NextResponse } from "next/server";

import {
  firstHeaderValue,
  hostFromUrl,
  isCrossSiteOrigin,
} from "@/lib/request-security";

const ADMIN_SESSION_COOKIE = "admin_session";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const BETTER_AUTH_COOKIE_HINT = "better-auth.session_token";

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

  if (isAdminApi && !SAFE_METHODS.has(request.method)) {
    const allowedHosts = [
      request.headers.get("host"),
      firstHeaderValue(request.headers.get("x-forwarded-host")),
      hostFromUrl(process.env.NEXT_PUBLIC_APP_URL),
      hostFromUrl(process.env.BETTER_AUTH_URL),
      hostFromUrl(process.env.AUTH_URL),
    ];

    if (
      isCrossSiteOrigin({
        origin: request.headers.get("origin"),
        allowedHosts,
      })
    ) {
      return NextResponse.json(
        { errors: { auth: "Origin tidak diizinkan." } },
        { status: 403 },
      );
    }
  }

  const isAuthenticated = await verifyAdminSession(
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value,
  );

  if (isAuthenticated) {
    return NextResponse.next();
  }

  // Better Auth issues its own session cookie, and only the app runtime can
  // verify it against the database. When that cookie is present, defer to the
  // admin layout and the admin route handlers, which run the authoritative
  // check; otherwise Google admin logins would be locked out here.
  if (hasBetterAuthSessionCookie(request)) {
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

function hasBetterAuthSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.includes(BETTER_AUTH_COOKIE_HINT) &&
        cookie.value.length > 0,
    );
}

async function verifyAdminSession(session: string | undefined) {
  if (!session) {
    return false;
  }

  const [encodedPayload, signature] = session.split(".");

  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = await signSessionPayload(encodedPayload);

  if (!(await safeEqual(signature, expectedSignature))) {
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

async function safeEqual(received: string, expected: string) {
  if (!received || !expected) {
    return false;
  }

  const [receivedHash, expectedHash] = await Promise.all([
    sha256(received),
    sha256(expected),
  ]);

  let difference = 0;

  for (let index = 0; index < receivedHash.length; index += 1) {
    difference |= (receivedHash[index] ?? 0) ^ (expectedHash[index] ?? 0);
  }

  return difference === 0;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return new Uint8Array(digest);
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
import { NextRequest, NextResponse } from "next/server";

import {
  MAX_CSP_REPORT_BODY_BYTES,
  createCspReportDeduplicator,
  normalizeCspReports,
} from "@/lib/csp-report";
import {
  RATE_LIMITS,
  buildRateLimitKey,
  consumeRateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deduplicator = createCspReportDeduplicator();

function methodNotAllowed() {
  return new NextResponse(null, {
    status: 405,
    headers: { Allow: "POST" },
  });
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rateLimit = consumeRateLimit({
    key: buildRateLimitKey("csp-report", clientIp),
    rule: RATE_LIMITS.cspReport,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  const rawBody = await request.text().catch(() => "");

  if (Buffer.byteLength(rawBody, "utf8") > MAX_CSP_REPORT_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  // Browsers retry failed report deliveries. Always answer 204 after the body
  // has been accepted, even when the JSON is malformed.
  const reports = normalizeCspReports(rawBody);

  for (const report of reports) {
    if (!deduplicator.shouldLog(report)) {
      continue;
    }

    console.warn(`csp-report ${JSON.stringify(report)}`);
  }

  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}

import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";
import { sendWhatsAppReminderBatch } from "@/lib/whatsapp-reminders";

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

  const payload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  const dryRun = payload?.dryRun !== false;
  const limit = normalizeLimit(payload?.limit);

  const result = await sendWhatsAppReminderBatch({
    dryRun,
    limit,
    actorUserId: admin.id,
    reason: dryRun ? "admin-dry-run" : "admin-manual",
  });

  return NextResponse.json({
    ok: result.ok,
    dryRun: result.dryRun,
    providerEnabled: result.providerEnabled,
    recipientCount: result.recipientCount,
    sentCount: result.sentCount,
    failedCount: result.failedCount,
    skippedCount: result.skippedCount,
    recipients: result.recipients.map((recipient) => ({
      phone: maskPhone(recipient.phone),
      donorName: recipient.donorName,
      donationCount: recipient.donationCount,
      totalSettlementAmount: recipient.totalSettlementAmount,
      lastDonationAt: recipient.lastDonationAt?.toISOString() ?? null,
    })),
    results: result.results.map((sendResult) => ({
      phone: maskPhone(sendResult.phone),
      ok: sendResult.ok,
      status: sendResult.status,
      error: sendResult.error,
    })),
  });
}

function normalizeLimit(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function maskPhone(phone: string) {
  if (phone.length <= 4) {
    return "****";
  }

  return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
}

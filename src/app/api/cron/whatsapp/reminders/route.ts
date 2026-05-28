import { NextResponse } from "next/server";

import {
  getCronSecretFromHeaders,
  verifyCronSecret,
} from "@/lib/telegram-cron";
import { getWhatsAppReminderConfig, sendWhatsAppReminderBatch } from "@/lib/whatsapp-reminders";

export async function GET(request: Request) {
  if (!verifyCronSecret(getCronSecretFromHeaders(request.headers))) {
    return NextResponse.json(
      { errors: { auth: "Cron secret tidak valid." } },
      { status: 401 },
    );
  }

  const config = getWhatsAppReminderConfig();

  if (!config.enabled) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: "whatsapp-reminder-disabled",
    });
  }

  const result = await sendWhatsAppReminderBatch({
    dryRun: false,
    reason: "scheduled-cron",
    config,
  });

  return NextResponse.json({
    ok: result.ok,
    sent: result.sentCount > 0,
    providerEnabled: result.providerEnabled,
    recipientCount: result.recipientCount,
    sentCount: result.sentCount,
    failedCount: result.failedCount,
    skippedCount: result.skippedCount,
  });
}

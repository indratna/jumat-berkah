import { NextResponse } from "next/server";

import {
  getCronSecretFromHeaders,
  runWeeklyTelegramCron,
  verifyCronSecret,
} from "@/lib/telegram-cron";

export async function GET(request: Request) {
  if (!verifyCronSecret(getCronSecretFromHeaders(request.headers))) {
    return NextResponse.json(
      { errors: { auth: "Cron secret tidak valid." } },
      { status: 401 },
    );
  }

  const result = await runWeeklyTelegramCron();
  return NextResponse.json({ ok: true, ...result });
}

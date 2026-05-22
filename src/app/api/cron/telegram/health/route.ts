import { NextResponse } from "next/server";

import {
  getCronSecretFromHeaders,
  verifyCronSecret,
} from "@/lib/telegram-cron";
import { runTelegramHealthAlert } from "@/lib/telegram-alerts";

export async function GET(request: Request) {
  if (!verifyCronSecret(getCronSecretFromHeaders(request.headers))) {
    return NextResponse.json(
      { errors: { auth: "Cron secret tidak valid." } },
      { status: 401 },
    );
  }

  const result = await runTelegramHealthAlert();
  return NextResponse.json({ ok: true, result });
}

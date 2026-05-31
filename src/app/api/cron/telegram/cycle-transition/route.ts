import { NextResponse } from "next/server";

import {
  getCronSecretFromHeaders,
  runWeeklyCycleTransitionCron,
  verifyCronSecret,
} from "@/lib/telegram-cron";

export async function GET(request: Request) {
  if (!verifyCronSecret(getCronSecretFromHeaders(request.headers))) {
    return NextResponse.json(
      { errors: { auth: "Cron secret tidak valid." } },
      { status: 401 },
    );
  }

  const result = await runWeeklyCycleTransitionCron();
  return NextResponse.json({ ok: true, ...result });
}

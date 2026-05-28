import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { ADMIN_SESSION_COOKIE, requireAdminUser } from "@/lib/auth";
import { requireBetterAuthAdminUser } from "@/lib/better-auth-guards";
import { getPrisma } from "@/lib/db";
import {
  upsertWeeklyTarget,
  validateWeeklyTargetInput,
} from "@/lib/weekly-target";

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
  const validation = validateWeeklyTargetInput(payload ?? {});

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const prisma = getPrisma();
  const previous = await prisma.weeklyTarget.findUnique({
    where: { cycleStart: validation.data.cycleStart },
  });

  const target = await upsertWeeklyTarget({
    cycleStart: validation.data.cycleStart,
    targetAmount: validation.data.targetAmount,
    note: validation.data.note,
    createdBy: admin.id,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: previous ? "weekly_target.updated" : "weekly_target.created",
      entityType: "weekly_target",
      entityId: target.id,
      before: previous
        ? {
            cycleStart: previous.cycleStart.toISOString().slice(0, 10),
            cycleEnd: previous.cycleEnd.toISOString().slice(0, 10),
            targetAmount: previous.targetAmount,
            note: previous.note,
          }
        : Prisma.JsonNull,
      after: {
        cycleStart: target.cycleStart.toISOString().slice(0, 10),
        cycleEnd: target.cycleEnd.toISOString().slice(0, 10),
        targetAmount: target.targetAmount,
        note: target.note,
      },
    },
  });

  return NextResponse.json({
    id: target.id,
    cycleStart: target.cycleStart.toISOString().slice(0, 10),
    cycleEnd: target.cycleEnd.toISOString().slice(0, 10),
    targetAmount: target.targetAmount,
    note: target.note,
  });
}

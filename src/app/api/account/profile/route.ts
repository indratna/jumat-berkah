import { NextResponse } from "next/server";

import {
  getCurrentAccountProfile,
  updateCurrentAccountProfile,
  validateProfilePayload,
} from "@/lib/account-profile";

export async function PATCH(request: Request) {
  const user = await getCurrentAccountProfile();

  if (!user) {
    return NextResponse.json(
      { errors: { auth: "Unauthorized" } },
      { status: 401 },
    );
  }

  const payload = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const validation = validateProfilePayload(payload ?? {});

  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const updated = await updateCurrentAccountProfile({
    user,
    name: validation.data.name,
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
  });
}

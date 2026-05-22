import { NextResponse } from "next/server";

export function GET() {
  return unauthorized();
}

export function POST() {
  return unauthorized();
}

export function PATCH() {
  return unauthorized();
}

export function DELETE() {
  return unauthorized();
}

function unauthorized() {
  return NextResponse.json({ errors: { auth: "Unauthorized" } }, { status: 401 });
}

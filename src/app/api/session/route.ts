import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session-cookie";

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}

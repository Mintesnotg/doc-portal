import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/session-cookie";

type Body = {
  email?: string;
  password?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "";
  if (!base) {
    return NextResponse.json(
      { error: "Server misconfiguration: API base URL is not set." },
      { status: 500 },
    );
  }

  const backendRes = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = (await backendRes.json().catch(() => ({}))) as Partial<{
    access_token: string;
    expires_in: number;
    error: string;
  }>;

  if (!backendRes.ok) {
    if (backendRes.status === 401) {
      return NextResponse.json(
        { error: "Incorrect email or password." },
        { status: 401 },
      );
    }
    if (backendRes.status === 400) {
      return NextResponse.json(
        { error: data.error || "Invalid input." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        error:
          data.error || "Something went wrong. Please try again.",
      },
      { status: 502 },
    );
  }

  if (!data.access_token) {
    return NextResponse.json(
      { error: "Malformed response from authentication server." },
      { status: 502 },
    );
  }

  const maxAge =
    typeof data.expires_in === "number" && data.expires_in > 0
      ? data.expires_in
      : 60 * 60;

  const response = NextResponse.json({ ok: true });
  setSessionCookie(response, data.access_token, maxAge);
  return response;
}

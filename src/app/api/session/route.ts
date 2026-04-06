import { NextResponse, NextRequest } from "next/server";

const isProd = process.env.NODE_ENV === "production";
// __Host- prefix enforces Secure+Path=/+no Domain. In dev, use a plain name to work over http.
const COOKIE_NAME = isProd ? "__Host-token" : "token";

export async function POST(req: NextRequest) {
  const { token, maxAge } = (await req.json().catch(() => ({}))) as {
    token?: string;
    maxAge?: number;
  };

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: maxAge ?? 60 * 60,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    path: "/",
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 0,
  });
  return response;
}

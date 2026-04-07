import type { NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

/** __Host- prefix enforces Secure+Path=/+no Domain. In dev, use a plain name over http. */
export const SESSION_COOKIE_NAME = isProd ? "__Host-token" : "token";

export function setSessionCookie(
  response: NextResponse,
  token: string,
  maxAgeSeconds: number,
) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    path: "/",
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 0,
  });
}

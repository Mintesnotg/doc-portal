import { NextResponse, type NextRequest } from "next/server";
import { decodeJwt } from "@/lib/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";

// Protect all "(app)" routes (dashboard, users, roles, etc.) by requiring
// a non-expired JWT in the session cookie. Public routes like "/" and
// API login/session endpoints remain accessible without auth.
export function middleware(request: NextRequest) {
  debugger;
  const { nextUrl, cookies } = request;
  const { pathname } = nextUrl;

  // Allow public entrypoints and auth/session APIs through without checks.
  if (
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/session") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets")
  ) {
    return NextResponse.next();
  }

  // Only guard the application shell under "(app)" – adjust this if you
  // add more protected segments.
  const isProtectedAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/roles") ||
    pathname.startsWith("/permissions") ||
    pathname.startsWith("/docs");

  if (!isProtectedAppRoute) {
    return NextResponse.next();
  }

  const token =
    cookies.get(SESSION_COOKIE_NAME)?.value ||
    cookies.get("__Host-token")?.value ||
    cookies.get("token")?.value ||
    cookies.get("access_token")?.value;

  if (!token) {

    console.log(` does the token exist : -  ${token}` )
    const url = new URL("/", request.url);
    return NextResponse.redirect(url);
  }

  const decoded = decodeJwt(token);
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const isExpired = decoded?.exp !== undefined && decoded.exp < nowInSeconds;

  if (!decoded || isExpired) {

    const url = new URL("/", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run this middleware on all routes except static assets and Next internals.
     * More precise scoping is done in the function above.
     */
    "/((?!_next/static|_next/image|favicon.ico|assets/).*)",
  ],
};


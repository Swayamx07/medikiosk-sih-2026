import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const PHYSICIAN_COOKIE_NAME = "medikiosk_physician_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /doctor routes except /doctor/login and public assets
  if (pathname.startsWith("/doctor")) {
    // Exclude the login page itself to prevent redirect loops
    if (pathname === "/doctor/login") {
      // If physician is already logged in, redirect to requested route or /doctor
      const existingSession = request.cookies.get(PHYSICIAN_COOKIE_NAME)?.value;
      if (existingSession && existingSession.includes(".")) {
        const rawRedirect = request.nextUrl.searchParams.get("redirect");
        const isValidRedirect =
          rawRedirect &&
          rawRedirect.startsWith("/doctor") &&
          !rawRedirect.startsWith("//") &&
          rawRedirect !== "/doctor/login";
        const target = isValidRedirect ? rawRedirect : "/doctor";
        const redirectUrl = new URL(target, request.url);
        return NextResponse.redirect(redirectUrl);
      }
      return NextResponse.next();
    }

    const sessionCookie = request.cookies.get(PHYSICIAN_COOKIE_NAME)?.value;

    // Check presence and basic format of signed token (payload.signature)
    if (!sessionCookie || !sessionCookie.includes(".")) {
      const loginUrl = new URL("/doctor/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const [payloadBase64] = sessionCookie.split(".");
      // Base64URL decode in Edge runtime using standard atob
      const normalizedBase64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
      const decodedJson = atob(normalizedBase64);
      const parsed = JSON.parse(decodedJson);

      // Verify expiration timestamp
      if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
        const loginUrl = new URL("/doctor/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        loginUrl.searchParams.set("expired", "1");
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete(PHYSICIAN_COOKIE_NAME);
        return response;
      }
    } catch {
      // Corrupt or tampered cookie
      const loginUrl = new URL("/doctor/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(PHYSICIAN_COOKIE_NAME);
      return response;
    }
  }

  // Security response headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Prevent browser caching and history/bfcache exposure for protected physician pages
  if (pathname.startsWith("/doctor") && pathname !== "/doctor/login") {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: ["/doctor/:path*"],
};

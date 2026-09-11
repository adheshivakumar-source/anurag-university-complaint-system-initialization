// src/middleware.ts
// ============================================================
// Next.js Middleware for AU-CTS route protection.
//
// SECURITY CLASSIFICATION: UX protection layer only.
// This middleware provides fast, lightweight route guards for
// user experience (preventing unauthenticated page flashes).
//
// It is NOT the ultimate security boundary. Sensitive data access
// must be re-verified in Server Components and Server Actions using
// the Firebase Admin SDK (src/lib/auth/session.ts).
//
// The middleware checks for the presence of the session cookie only.
// Full signature verification is done by Server Components on
// routes that access sensitive data.
//
// Next.js Middleware runs on the Edge Runtime.
// firebase-admin is NOT compatible with Edge Runtime.
// Do NOT import firebase-admin here.
// ============================================================

import { type NextRequest, NextResponse } from "next/server";

/** Routes that require authentication to access */
const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/complaints",
  "/admin",
  "/officer",
  "/profile",
];

/** Routes that should redirect authenticated users to dashboard */
const AUTH_ROUTE_PREFIXES = ["/login", "/register"];

const SESSION_COOKIE_NAME = "__session";

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  const isAuthRoute = AUTH_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  // Unauthenticated user trying to access a protected route
  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    // Preserve the intended destination for post-login redirect
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user visiting login/register — redirect to dashboard
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}
export const middleware = proxy;

export const config = {
  /*
   * Match all routes EXCEPT:
   * - Next.js internals (_next/static, _next/image)
   * - API routes that handle their own auth (/api/auth/*)
   * - Static files (favicon, images, fonts, etc.)
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};

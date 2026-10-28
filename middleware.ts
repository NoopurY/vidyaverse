import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// Endpoints that legitimately receive cross-origin / machine requests (they authenticate on their own)
const CSRF_EXEMPT = ["/api/auth/", "/api/whatsapp/webhook", "/api/cron/", "/api/v1/auth/token"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  // CSRF: state-changing cookie-authenticated API calls must come from our own origin
  if (pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(method)) {
    const machine = req.headers.get("authorization")?.startsWith("Bearer ") || req.headers.has("x-api-key");
    if (!machine && !CSRF_EXEMPT.some((p) => pathname.startsWith(p))) {
      const origin = req.headers.get("origin");
      const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
      if (!origin || new URL(origin).host !== host) {
        return NextResponse.json({ error: "CSRF check failed: cross-origin request rejected" }, { status: 403 });
      }
    }
  }
  return undefined;
});

export const config = {
  matcher: ["/aicte/:path*", "/institution/:path*", "/student/:path*", "/login", "/api/:path*"],
};

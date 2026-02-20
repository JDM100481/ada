import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/chats", "/room", "/actions", "/contacts", "/me", "/api/rooms", "/api/cards", "/api/upload"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const hasSession = Boolean(request.cookies.get("digicom_session")?.value);

  if (isProtected && !hasSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/" && hasSession) {
    return NextResponse.redirect(new URL("/chats", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/chats/:path*", "/room/:path*", "/actions/:path*", "/contacts/:path*", "/me/:path*", "/api/:path*"]
};

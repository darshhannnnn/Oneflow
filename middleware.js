import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  const { pathname } = request.nextUrl;

  // Allow access to login and API auth routes
  if (
    pathname.startsWith("/api/auth") || 
    pathname === "/login" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Redirect to login if no token
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/assistant/:path*",
    "/api/projects/:path*",
    "/api/tasks/:path*",
    "/api/timesheets/:path*",
    "/api/expenses/:path*",
  ]
};

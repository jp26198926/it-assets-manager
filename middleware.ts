import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/actions/auth";

// Get basePath from environment or default to empty string
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const sessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "complex_password_at_least_32_characters_long",
  cookieName: "ticketing_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    path: basePath || "/", // Use basePath if set, otherwise "/"
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

// Public routes that don't require authentication
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/api/auth",
  "/knowledgebase",
  "/install",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow install route always
  if (pathname.startsWith("/install")) {
    return NextResponse.next();
  }

  // Allow public routes and knowledgebase article pages
  if (
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    pathname.match(/^\/knowledgebase\/[^/]+$/)
  ) {
    return NextResponse.next();
  }

  // Check session
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions,
  );

  // Redirect to login if not authenticated
  if (!session.isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add user info to headers for server components
  response.headers.set("x-user-id", session.userId);
  response.headers.set("x-user-role", session.role);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes that handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

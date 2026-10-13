import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/today", "/habits", "/progress", "/journal", "/focus"];
const AUTH_PREFIXES = ["/sign-in", "/register"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const { isAuthenticated, redirectToSignIn } = await auth();

  // Early redirects only (a performance optimization, not the access check).
  // Every protected page and Server Action still checks auth itself.
  if (!isAuthenticated && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    return redirectToSignIn();
  }

  if (isAuthenticated && matchesPrefix(pathname, AUTH_PREFIXES)) {
    return NextResponse.redirect(new URL("/today", req.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

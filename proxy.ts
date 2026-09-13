import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const isAuth = !!req.nextauth.token;

    // Only the home page and the auth flow are publicly accessible
    const isPublic =
      pathname === "/" ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/easy-card/shared/") ||
      pathname === "/privacy-policy" ||
      pathname === "/terms-of-service";

    if (isPublic) {
      return NextResponse.next();
    }

    // Every other route requires an authenticated session
    if (!isAuth) {
      const url = req.nextUrl.clone();
      url.pathname = "/auth";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Always let the middleware function run (auth check is done inside)
      authorized: () => true,
    },
    pages: {
      signIn: "/auth",
    },
  },
);

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *  - /api/* (backend routes handle their own auth)
     *  - /_next/static, /_next/image (Next.js internals)
     *  - /favicon.ico, /icons/*, /images/* (static public assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icons|images).*)",
  ],
};

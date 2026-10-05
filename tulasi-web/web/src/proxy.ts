// Runs before routing:
// 1. WordPress shortlinks (/?p=123, /?page_id=45) → the canonical URL (301),
//    without carrying the query string along.
// 2. /portal/ without the "signed in" hint cookie goes to the login page.
//    The hint is not a credential: the portal verifies the real httpOnly
//    session with the API on every request; this only avoids an empty flash.
import { NextResponse, type NextRequest } from "next/server";
import shortlinks from "../content/shortlinks.json";

const map = shortlinks as { p: Record<string, string>; page_id: Record<string, string> };

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/") {
    const p = searchParams.get("p");
    const pageId = searchParams.get("page_id");
    const target = (p && map.p[p]) || (pageId && map.page_id[pageId]);
    if (target) return NextResponse.redirect(new URL(target, request.url), 301);
  }

  if (pathname.startsWith("/portal") && !request.cookies.has("thc_signed_in") && !request.cookies.has("thc_session")) {
    const url = new URL("/patient-login/", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/portal/:path*"],
};

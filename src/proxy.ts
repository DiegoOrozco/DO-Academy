import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect Admin Routes
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        const adminSession = request.cookies.get("admin_session");

        if (!adminSession || adminSession.value !== "valid") {
            // Return 404 to hide the existence of admin routes for unauthenticated users
            const url = request.nextUrl.clone();
            url.pathname = "/404";
            return NextResponse.rewrite(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};

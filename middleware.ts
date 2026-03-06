import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import CryptoJS from 'crypto-js';

const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-secret-for-dev-only-change-in-prod';

function verifySession(signedValue: string | undefined): string | null {
    if (!signedValue) return null;
    const parts = signedValue.split('.');
    if (parts.length !== 2) return null;
    const [value, signature] = parts;
    const expectedSignature = CryptoJS.HmacSHA256(value, SESSION_SECRET).toString();
    return signature === expectedSignature ? value : null;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // --- SECURITY HEADERS ---
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // Protect Admin Routes
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        const adminSession = request.cookies.get("admin_session")?.value;
        const verifiedValue = verifySession(adminSession);

        if (verifiedValue !== "valid") {
            const url = request.nextUrl.clone();
            if (pathname === "/admin") {
                url.pathname = "/admin/login";
                return NextResponse.redirect(url);
            }
            // Hide deeper admin routes behind 404
            url.pathname = "/404";
            const rewriteRes = NextResponse.rewrite(url);
            // Copy headers to rewrite response
            response.headers.forEach((v, k) => rewriteRes.headers.set(k, v));
            return rewriteRes;
        }
    }

    return response;
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

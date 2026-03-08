import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { signSession } from "@/lib/session";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    if (!code) {
        return NextResponse.redirect(`${NEXT_PUBLIC_BASE_URL}/login?error=google_no_code`);
    }

    try {
        const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

        // Exchange code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID!,
                client_secret: GOOGLE_CLIENT_SECRET!,
                redirect_uri: `${NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`,
                grant_type: "authorization_code",
            }),
        });

        const tokens = await tokenResponse.json();
        if (tokens.error) {
            console.error("Google Token Error:", tokens);
            return NextResponse.redirect(`${NEXT_PUBLIC_BASE_URL}/login?error=google_token_failed`);
        }

        // Get user info
        const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const googleUser = await userResponse.json();
        if (!googleUser.email) {
            return NextResponse.redirect(`${NEXT_PUBLIC_BASE_URL}/login?error=google_no_email`);
        }

        // Find or create user
        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { googleId: googleUser.id },
                    { email: googleUser.email }
                ]
            }
        });

        if (!user) {
            // Create user with a dummy password since they use Google
            // (Existing logic uses bcrypt.hash, we could generate a random one)
            user = await prisma.user.create({
                data: {
                    name: googleUser.name || googleUser.email.split('@')[0],
                    email: googleUser.email,
                    googleId: googleUser.id,
                    password: "GOOGLE_AUTH_USER", // Placeholder, login handled via Google
                    role: "STUDENT",
                    emailVerified: true,
                }
            });
        } else if (!user.googleId) {
            // Link existing account
            user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: googleUser.id }
            });
        }

        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set("student_id", signSession(user.id), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return NextResponse.redirect(NEXT_PUBLIC_BASE_URL);

    } catch (error) {
        console.error("Google Auth Error:", error);
        return NextResponse.redirect(`${NEXT_PUBLIC_BASE_URL}/login?error=google_auth_failed`);
    }
}

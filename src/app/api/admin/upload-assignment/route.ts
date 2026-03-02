import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const user = await getAuthUser();

        // Security: Only Admins can upload assignments
        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const filename = searchParams.get("filename");

        // Debug: Check token (truncated for security)
        console.log("Upload attempt for:", filename);
        console.log("Token present:", !!process.env.BLOB_READ_WRITE_TOKEN);

        if (!filename) {
            return NextResponse.json({ error: "Filename is required" }, { status: 400 });
        }

        if (!request.body) {
            return NextResponse.json({ error: "No file content provided" }, { status: 400 });
        }

        const blob = await put(filename, request.body, {
            access: "public",
            token: process.env.BLOB_READ_WRITE_TOKEN, // Explicitly pass it just in case
        });

        console.log("Upload successful:", blob.url);
        return NextResponse.json(blob);
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

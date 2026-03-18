import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { blobs } = await list({
            token: process.env.BLOB_READ_WRITE_TOKEN,
            prefix: "backups/",
        });

        // Sort by timestamp if possible, or just return all
        const sortedBlobs = blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

        return NextResponse.json({
            success: true,
            backups: sortedBlobs.map(b => ({
                url: b.url,
                uploadedAt: b.uploadedAt,
                size: b.size,
                pathname: b.pathname
            }))
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { processNextPendingSubmission } from "@/actions/admin-grading";

export const dynamic = 'force-dynamic';
// Vercel Cron will send the Authorization header with this token
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
    console.log("[CRON] Grading job started");

    // 1. Verify Vercel Cron Secret (if configured)
    const authHeader = req.headers.get("authorization");
    if (CRON_SECRET && CRON_SECRET.length > 0) {
        if (authHeader !== `Bearer ${CRON_SECRET}`) {
            console.error("[CRON] Unauthorized attempt");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const result = await processNextPendingSubmission();
        console.log(`[CRON] Grading job finished. Result:`, result);
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("[CRON] Grading job failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

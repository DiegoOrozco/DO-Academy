import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("student_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { dayId, seconds, percent } = await req.json();
    if (!dayId || typeof dayId !== "string") {
      return NextResponse.json({ error: "INVALID_DAY" }, { status: 400 });
    }

    const sec = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const pct = Number.isFinite(percent)
      ? Math.max(0, Math.min(100, Math.floor(percent)))
      : null;

    const vp = await prisma.videoProgress.upsert({
      where: { userId_dayId: { userId, dayId } },
      create: { userId, dayId, seconds: sec, percent: pct ?? undefined },
      update: { seconds: sec, percent: pct ?? undefined },
    });

    return NextResponse.json({ success: true, progress: vp });
  } catch (err) {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}


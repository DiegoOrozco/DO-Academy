import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
export async function GET() {
    return NextResponse.json({
        urls: await prisma.day.findMany({ select: { id: true, summaryUrl: true, materialUrl: true, assignmentUrl: true } }),
        config: await prisma.siteConfig.findMany()
    });
}

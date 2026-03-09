import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function GET(request: Request) {
    try {
        // Simple security check using a CRON_SECRET or just enforcing Vercel's internal cron header.
        const authHeader = request.headers.get('authorization');
        const isCron = request.headers.get('user-agent')?.includes('vercel-cron');

        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // Also allow if it comes from vercel's internal cron engine
            if (!isCron) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        console.log("Starting automated database backup...");

        // Fetch all data models
        const users = await prisma.user.findMany();
        const siteConfigs = await prisma.siteConfig.findMany();
        const courses = await prisma.course.findMany();
        const weeks = await prisma.week.findMany();
        const days = await prisma.day.findMany();
        const codeFiles = await prisma.codeFile.findMany();
        const preloadedFiles = await prisma.preloadedFile.findMany();
        const enrollments = await prisma.enrollment.findMany();
        const testResults = await prisma.testResult.findMany();
        const consoleOutputs = await prisma.consoleOutput.findMany();

        const backupData = {
            timestamp: new Date().toISOString(),
            version: "1.0",
            data: {
                users,
                siteConfigs,
                courses,
                weeks,
                days,
                codeFiles,
                preloadedFiles,
                enrollments,
                testResults,
                consoleOutputs
            }
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const buffer = Buffer.from(jsonString, 'utf-8');

        // Create a filename like: resguardo-2026-03-08.json
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `backups/resguardo-${dateStr}.json`;

        const blob = await put(filename, buffer, {
            access: "public", // Using public for Vercel Blob basic tier, but URLs are unguessable
            token: process.env.BLOB_READ_WRITE_TOKEN,
            addRandomSuffix: false,
            allowOverwrite: true,
            contentType: "application/json"
        });

        console.log(`Backup completed successfully: ${blob.url}`);

        return NextResponse.json({
            success: true,
            message: "Backup created successfully",
            timestamp: backupData.timestamp,
            fileSizeValidation: buffer.byteLength,
            url: blob.url
        });

    } catch (error: any) {
        console.error("Backup failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

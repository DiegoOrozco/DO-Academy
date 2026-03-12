import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { put } from "@vercel/blob";
import { gradeSubmission } from "@/lib/gemini";

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== "STUDENT") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const dayId = formData.get("dayId") as string;

        if (!file || !dayId) {
            return NextResponse.json({ error: "Missing file or dayId" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = file.name;
        const mimeType = file.type;

        console.log(`Grading Request: File="${fileName}", Size=${file.size} bytes, MimeType=${mimeType}`);

        // Upload to Vercel Blob
        const blob = await put(`submissions/${user.id}/${dayId}/${fileName}`, buffer, {
            access: "public",
            addRandomSuffix: true, // Use random suffix to avoid collisions if multiple attempts
        });

        // Fetch day limits and exceptions
        const day = await prisma.day.findUnique({
            where: { id: dayId },
            include: {
                deadlineExceptions: {
                    where: { userId: user.id }
                }
            }
        });

        if (!day) {
            return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });
        }

        // AvailableFrom enforcement
        if (day.availableFrom && new Date() < new Date(day.availableFrom)) {
            return NextResponse.json({
                error: "La ventana de entrega aún no ha abierto.",
                code: "NOT_AVAILABLE_YET"
            }, { status: 403 });
        }

        // Deadline enforcement
        if (day.dueDate) {
            const now = new Date();
            let effectiveDueDate = new Date(day.dueDate);

            if (day.deadlineExceptions && day.deadlineExceptions.length > 0) {
                effectiveDueDate = new Date(day.deadlineExceptions[0].newDueDate);
            }

            if (now > effectiveDueDate) {
                return NextResponse.json({
                    error: "El tiempo límite para esta entrega ha expirado.",
                    code: "DEADLINE_PASSED"
                }, { status: 403 });
            }
        }

        // Store blob URL in content
        const dbContent = blob.url;

        const submission = await prisma.submission.upsert({
            where: {
                userId_dayId: {
                    userId: user.id,
                    dayId: dayId
                }
            } as any,
            update: {
                content: dbContent,
                fileName: fileName,
                status: "PENDING",
                grade: null,
                feedback: {},
            },
            create: {
                userId: user.id,
                dayId: dayId,
                content: dbContent,
                fileName: fileName,
                status: "PENDING",
            }
        });

        return NextResponse.json(submission);

    } catch (error) {
        console.error("Submission API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

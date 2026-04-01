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

        const dbContent = blob.url;

        // Fetch student group for this course
        const studentGroup = await prisma.group.findFirst({
            where: {
                course: { weeks: { some: { days: { some: { id: dayId } } } } },
                members: { some: { id: user.id } }
            },
            select: { id: true }
        });
        const groupId = studentGroup?.id || null;

        // Cleanup: If there's an existing submission (individual or group), delete the old blob
        try {
            const existingSubmission = await prisma.submission.findFirst({
                where: {
                    dayId,
                    OR: [
                        { userId: user.id },
                        groupId ? { groupId } : { id: 'none' }
                    ]
                }
            });

            if (existingSubmission?.content && existingSubmission.content.includes("vercel-storage.com")) {
                const { del } = await import("@vercel/blob");
                await del(existingSubmission.content);
                console.log(`[CLEANUP] Deleted old blob: ${existingSubmission.content}`);
            }

            const submissionData = {
                userId: user.id,
                groupId,
                dayId: dayId,
                content: dbContent,
                fileName: fileName,
                status: "PENDING",
                grade: null,
                feedback: {},
            };

            let submission;
            if (existingSubmission) {
                submission = await prisma.submission.update({
                    where: { id: existingSubmission.id },
                    data: (submissionData as any)
                });
            } else {
                submission = await prisma.submission.create({
                    data: (submissionData as any)
                });
            }

            return NextResponse.json(submission);
        } catch (subError) {
            console.error("[SUBMISSION] Error saving to DB:", subError);
            return NextResponse.json({ error: "Error al guardar la entrega" }, { status: 500 });
        }

    } catch (error) {
        console.error("Submission API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
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

        // Deadline enforcement
        if (day.dueDate) {
            const now = new Date();
            let effectiveDueDate = new Date(day.dueDate);

            // Check if there is an exception for this user
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

        // Create initial pending submission
        // For PDFs, we don't store the binary in the text content field
        const dbContent = mimeType === "application/pdf"
            ? `[PDF Document: ${fileName}]`
            : buffer.toString("utf-8");

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
            },
            create: {
                userId: user.id,
                dayId: dayId,
                content: dbContent,
                fileName: fileName,
                status: "PENDING",
            }
        });

        try {
            // Day is already fetched, we can use it directly

            // Call Gemini for grading (now supporting buffers, severity, and instructions)
            const gradingResult = await gradeSubmission(
                fileName,
                buffer,
                mimeType,
                day?.gradingSeverity || 1,
                day?.exerciseDescription || undefined
            );

            // Update submission with results
            const updatedSubmission = await prisma.submission.update({
                where: { id: submission.id },
                data: {
                    status: "GRADED",
                    grade: gradingResult.nota,
                    feedback: gradingResult,
                    // If Gemini extracted a summary of the code/logic, store it as content
                    // BUT ONLY if the original submission was a PDF. If it was raw code, keep the raw code for accurate plagiarism detection.
                    ...(gradingResult.resumen_codigo && mimeType === "application/pdf" && { content: gradingResult.resumen_codigo })
                }
            });

            return NextResponse.json(updatedSubmission);
        } catch (gradingError: any) {
            console.error("CRITICAL: Grading failed for", fileName, gradingError);
            console.error("Error Stack:", gradingError.stack);

            await prisma.submission.update({
                where: { id: submission.id },
                data: {
                    status: "FAILED",
                    feedback: { error: gradingError.message || "Unknown grading error" }
                }
            });

            return NextResponse.json({
                error: `Grading failed: ${gradingError.message || 'Check logs'}`
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Submission API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

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

        // Create initial pending submission
        // For PDFs, we don't store the binary in the text content field
        const dbContent = mimeType === "application/pdf"
            ? `[PDF Document: ${fileName}]`
            : buffer.toString("utf-8");

        const submission = await prisma.submission.create({
            data: {
                userId: user.id,
                dayId: dayId,
                content: dbContent,
                fileName: fileName,
                status: "PENDING",
            }
        });

        try {
            // Fetch day to get grading severity
            const day = await prisma.day.findUnique({
                where: { id: dayId },
                select: { gradingSeverity: true }
            });

            // Call Gemini for grading (now supporting buffers and severity)
            const gradingResult = await gradeSubmission(fileName, buffer, mimeType, day?.gradingSeverity || 1);

            // Update submission with results
            const updatedSubmission = await prisma.submission.update({
                where: { id: submission.id },
                data: {
                    status: "GRADED",
                    grade: gradingResult.nota,
                    feedback: gradingResult,
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

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

        const content = await file.text();
        const fileName = file.name;

        // Create initial pending submission
        const submission = await prisma.submission.create({
            data: {
                userId: user.id,
                dayId: dayId,
                content: content,
                fileName: fileName,
                status: "PENDING",
            }
        });

        try {
            // Call Gemini for grading
            const gradingResult = await gradeSubmission(fileName, content);

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
        } catch (gradingError) {
            console.error("Grading error:", gradingError);

            await prisma.submission.update({
                where: { id: submission.id },
                data: { status: "FAILED" }
            });

            return NextResponse.json({ error: "Grading failed" }, { status: 500 });
        }

    } catch (error) {
        console.error("Submission API error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

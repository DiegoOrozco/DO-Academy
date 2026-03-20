"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import stringSimilarity from "string-similarity";
import { ensureStudent } from "@/lib/auth-guards";
import { z } from "zod";

const submissionSchema = z.object({
    dayId: z.string().min(1),
    code: z.string().min(1),
    outputs: z.array(z.string())
});

export async function submitCodingExercise(rawInput: any) {
    try {
        const { dayId, code, outputs } = submissionSchema.parse(rawInput);
        const student = await ensureStudent();
        const userId = student.id;
        const day = await prisma.day.findUnique({
            where: { id: dayId },
            select: {
                expectedOutput: true,
                testCases: true,
                similarityThreshold: true,
                enablePlagiarism: true,
                exerciseDescription: true,
                gradingSeverity: true,
            } as any,
        }) as any;

        if (!day) throw new Error("Ejercicio no encontrado");

        let grade = 0;
        let feedbackText = "";
        let isAiGraded = false;

        const testCases: any[] = Array.isArray(day.testCases) && day.testCases.length > 0
            ? day.testCases
            : (day.expectedOutput ? [{ output: day.expectedOutput }] : []);

        // DECISION: If there are test cases and we have outputs, use similarity.
        // OTHERWISE: Use AI Grading.
        if (testCases.length > 0 && outputs && outputs.length > 0) {
            let totalSimilarity = 0;
            let details = [];

            for (let i = 0; i < testCases.length; i++) {
                const tc = testCases[i];
                const cleanExpected = (tc.output || "").trim().toLowerCase();
                const cleanActual = (outputs[i] || "").trim().toLowerCase();

                let sim = 0;
                if (!cleanExpected && !cleanActual) {
                    sim = 1; // Both empty
                } else if (!cleanExpected || !cleanActual) {
                    sim = 0; // One is empty
                } else {
                    sim = stringSimilarity.compareTwoStrings(cleanExpected, cleanActual);
                }

                totalSimilarity += sim;
                details.push({ caso: i + 1, similitud: Math.round(sim * 100) });
            }

            const avgSimilarity = totalSimilarity / Math.max(testCases.length, 1);
            grade = Math.round(avgSimilarity * 100);
            const threshold = day.similarityThreshold || 0.9;

            if (avgSimilarity >= threshold) {
                feedbackText = `¡Excelente! Tu código superó las pruebas con un promedio de ${grade}% de precisión.\nCasos: ` + details.map(d => `C${d.caso}(${d.similitud}%)`).join(", ");
            } else {
                feedbackText = `Tu precisión promedio fue de ${grade}%. Se requiere al menos un ${Math.round(threshold * 100)}% para aprobar.\nCasos: ` + details.map(d => `C${d.caso}(${d.similitud}%)`).join(", ");
            }
        } else {
            // AI GRADING PATH
            const { gradeSubmission } = await import("@/lib/gemini");
            const aiResult = await gradeSubmission(
                "solution.py",
                code,
                "text/x-python",
                day.gradingSeverity || 1,
                day.exerciseDescription || ""
            );

            grade = aiResult.nota !== null ? aiResult.nota : 100; // If level 0, we give 100 or keep null? In DB it's Float?.
            feedbackText = aiResult.text || aiResult.comentario || "Revisión completada por IA.";
            isAiGraded = true;
        }

        const submission = await prisma.submission.upsert({
            where: {
                userId_dayId: { userId, dayId },
            } as any,
            update: {
                content: code,
                status: "GRADED",
                grade: grade,
                feedback: { 
                    text: feedbackText,
                    isAiGraded,
                    ...(isAiGraded ? {} : { outputs }) // Optionally store outputs if not AI graded
                } as any,
                fileName: "solution.py",
            },
            create: {
                userId,
                dayId,
                content: code,
                status: "GRADED",
                grade: grade,
                feedback: { 
                    text: feedbackText,
                    isAiGraded 
                } as any,
                fileName: "solution.py",
            },
        });

        console.log(`[Submission] Saved for user ${userId} on day ${dayId}. Content length: ${code.length}`);

        revalidatePath(`/courses`, "layout");

        return { success: true, submission, similarity: grade };
    } catch (error: any) {
        console.error("Submission error:", error);
        return { success: false, error: error.message };
    }
}

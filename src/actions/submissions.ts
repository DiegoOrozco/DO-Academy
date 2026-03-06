"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import stringSimilarity from "string-similarity";

export async function submitCodingExercise({
    userId,
    dayId,
    code,
    output,
}: {
    userId: string;
    dayId: string;
    code: string;
    output: string;
}) {
    try {
        // 1. Get Day details (expected output, threshold, etc.)
        const day = await prisma.day.findUnique({
            where: { id: dayId },
            select: {
                expectedOutput: true,
                similarityThreshold: true,
                enablePlagiarism: true,
            },
        });

        if (!day) throw new Error("Ejercicio no encontrado");

        let grade = 0;
        let feedbackText = "";

        if (day.expectedOutput) {
            const cleanExpected = day.expectedOutput.trim().toLowerCase();
            const cleanActual = output.trim().toLowerCase();

            const similarity = stringSimilarity.compareTwoStrings(cleanExpected, cleanActual);
            const threshold = day.similarityThreshold || 0.9;

            grade = Math.round(similarity * 100);

            if (similarity >= threshold) {
                feedbackText = `¡Excelente! Tu salida coincide en un ${grade}% con lo esperado.`;
            } else {
                feedbackText = `Tu salida tiene un ${grade}% de similitud. Se requiere al menos un ${Math.round(threshold * 100)}% para aprobar.`;
            }
        } else {
            grade = 100;
            feedbackText = "Entregado correctamente.";
        }

        // 3. Save Submission
        const submission = await prisma.submission.upsert({
            where: {
                userId_dayId: { userId, dayId },
            },
            update: {
                content: code,
                status: "GRADED",
                grade: grade,
                feedback: { text: feedbackText } as any, // Cast to any because Prisma Json type can be tricky
                fileName: "solution.py",
            },
            create: {
                userId,
                dayId,
                content: code,
                status: "GRADED",
                grade: grade,
                feedback: { text: feedbackText } as any,
                fileName: "solution.py",
            },
        });

        revalidatePath(`/courses`, "layout");

        return { success: true, submission, similarity: grade };
    } catch (error: any) {
        console.error("Submission error:", error);
        return { success: false, error: error.message };
    }
}

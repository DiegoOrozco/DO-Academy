"use server";

import prisma from "@/lib/prisma";
import { ensureAdmin } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";

export async function updateManualGrade(userId: string, dayId: string, grade: number) {
    try {
        await ensureAdmin();

        // Ensure valid grade bounds
        const finalGrade = Math.max(0, Math.min(100, Math.round(grade)));

        // Create or Update a Submission for this user/day pair
        // even if they never uploaded a file
        await prisma.submission.upsert({
            where: {
                userId_dayId: {
                    userId,
                    dayId
                }
            },
            create: {
                userId,
                dayId,
                content: "Assigned manually by Administrator",
                fileName: "manual_grade.txt",
                status: "GRADED",
                grade: finalGrade,
                feedback: { text: "Calificación asignada manualmente por el profesor." }
            },
            update: {
                status: "GRADED",
                grade: finalGrade,
                // Do not overwrite previous feedback immediately, unless you want to append
            }
        });

        revalidatePath("/admin/grades");
        revalidatePath("/admin/(portal)/courses/[courseId]/submissions/[dayId]", "page");
        revalidatePath("/");

        return { success: true };
    } catch (error: any) {
        console.error("Error updating manual grade:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteSubmission(userId: string, dayId: string) {
    try {
        await ensureAdmin();

        // 1. Find the submission to check for associated blob
        const submission = await prisma.submission.findUnique({
            where: {
                userId_dayId: {
                    userId,
                    dayId
                }
            }
        });

        if (!submission) {
            return { success: false, error: "Entrega no encontrada." };
        }

        // 2. Delete blob if exists
        if (submission.content && submission.content.includes("vercel-storage.com")) {
            try {
                const { del } = await import("@vercel/blob");
                await del(submission.content);
                console.log(`[ADMIN DELETE] Deleted blob: ${submission.content}`);
            } catch (blobError) {
                console.error("[ADMIN DELETE] Error deleting blob:", blobError);
                // Continue with DB deletion even if blob deletion fails
            }
        }

        // 3. Delete from database
        await prisma.submission.delete({
            where: {
                userId_dayId: {
                    userId,
                    dayId
                }
            }
        });

        // 4. Revalidate paths
        revalidatePath("/admin/grades");
        revalidatePath("/admin/(portal)/courses/[courseId]/submissions/[dayId]", "page");
        revalidatePath("/");

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting submission:", error);
        return { success: false, error: error.message };
    }
}

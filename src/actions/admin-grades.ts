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

export async function updateDetailedManualGrade(
    userId: string, 
    dayId: string, 
    grade: number, 
    feedback: { 
        text?: string, 
        feedback_positivo?: string[] | string, 
        mejoras?: string[] | string 
    }
) {
    try {
        await ensureAdmin();

        const finalGrade = Math.max(0, Math.min(100, Math.round(grade)));

        const submission = await prisma.submission.upsert({
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
                feedback: feedback
            },
            update: {
                status: "GRADED",
                grade: finalGrade,
                feedback: feedback
            },
            include: {
                user: { select: { email: true, name: true } },
                day: { select: { title: true } }
            }
        });

        // SEND EMAIL NOTIFICATION
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://doacademy.vercel.app";
        const gradesLink = `${baseUrl}/grades`;

        const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff;">
              <h2 style="color: #10b981; margin-bottom: 20px;">¡Tu tarea ha sido calificada!</h2>
              <div style="line-height: 1.6; color: #333; font-size: 16px; margin-bottom: 30px;">
                Hola <strong>${submission.user.name}</strong>,<br><br>
                Hemos terminado de revisar tu entrega para la actividad <strong>"${submission.day.title}"</strong>.
              </div>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
                <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Calificación Final</p>
                <p style="margin: 10px 0 0 0; font-size: 48px; font-weight: 900; color: #0f172a;">${finalGrade}</p>
              </div>

              <div style="text-align: center; margin-bottom: 35px;">
                <a href="${gradesLink}" style="display: inline-block; padding: 14px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Ver Comentarios y Detalles
                </a>
              </div>
              
              <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
              <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 20px;">
                &copy; ${new Date().getFullYear()} DO Academy - Todos los derechos reservados.
              </p>
            </div>
        `;

        try {
            const { sendEmail } = await import("@/lib/email");
            await sendEmail({
                to: submission.user.email,
                subject: `Calificación Lista: ${submission.day.title} — DO Academy`,
                html: htmlContent,
                replyTo: "no-reply@do-academy.com"
            });
            console.log(`[MANUAL GRADE] Email notification sent to ${submission.user.email}`);
        } catch (mailErr: any) {
            console.error(`[MANUAL GRADE] Email failed to send:`, mailErr);
        }

        revalidatePath("/admin/grades");
        revalidatePath("/admin/(portal)/courses/[courseId]/submissions/[dayId]", "page");
        revalidatePath("/");

        return { success: true };
    } catch (error: any) {
        console.error("Error updating detailed manual grade:", error);
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

export async function deleteAllCourseFiles(courseId: string) {
    try {
        await ensureAdmin();

        // 1. Find all submissions for this course that have file content (blobs)
        const submissions = await prisma.submission.findMany({
            where: {
                day: {
                    week: {
                        courseId: courseId
                    }
                },
                OR: [
                    { content: { contains: "vercel-storage.com" } },
                    { content: { contains: "http" } }
                ]
            }
        });

        if (submissions.length === 0) {
            return { success: true, message: "No se encontraron archivos para eliminar." };
        }

        const { del } = await import("@vercel/blob");
        let deletedCount = 0;

        for (const sub of submissions) {
            // Delete blob if it's a vercel storage URL
            if (sub.content && sub.content.includes("vercel-storage.com")) {
                try {
                    await del(sub.content);
                    deletedCount++;
                } catch (blobError) {
                    console.error(`[BATCH DELETE] Error deleting blob for sub ${sub.id}:`, blobError);
                }
            }

            // Update database record to clear the file but KEEP the grade and feedback
            await prisma.submission.update({
                where: { id: sub.id },
                data: {
                    content: "[Archivo eliminado por administración para liberar espacio]",
                    fileName: "archivo_removido.txt"
                }
            });
        }

        revalidatePath("/admin/grades");
        revalidatePath(`/admin/courses/${courseId}/submissions/[dayId]`, "layout");
        revalidatePath("/");

        return { success: true, deletedCount };
    } catch (error: any) {
        console.error("Error in deleteAllCourseFiles:", error);
        return { success: false, error: error.message };
    }
}

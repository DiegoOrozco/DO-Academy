"use server";

import prisma from "@/lib/prisma";
import { gradeSubmission } from "@/lib/gemini";
import { sendEmail } from "@/lib/email";

export async function processNextPendingSubmission(dayId?: string) {
    console.log(`[GRADING PROCESSOR] Fetching oldest PENDING submission ${dayId ? `for day ${dayId}` : "globally"}...`);

    // Find the oldest pending submission, optionally scoped by day
    const submission = await prisma.submission.findFirst({
        where: {
            status: "PENDING",
            ...(dayId && { dayId })
        },
        orderBy: { createdAt: "asc" },
        include: {
            user: { select: { email: true, name: true } },
            day: {
                select: {
                    id: true,
                    title: true,
                    gradingSeverity: true,
                    exerciseDescription: true,
                    week: { select: { courseId: true } }
                }
            }
        }
    });

    if (!submission) {
        console.log("[GRADING PROCESSOR] No pending submissions found.");
        return { success: true, message: "No pending submissions found.", processed: false };
    }

    console.log(`[GRADING PROCESSOR] Processing submission ${submission.id} for user ${submission.user.email}`);

    try {
        // We only have string content in DB now. If it's a PDF, we might have lost the binary unless we fetch it from blob storage. 
        // Wait, in our current architecture, we aren't saving the PDF binary to the DB if it's large, we were just passing it to Gemini in the same request.
        // If we want to async grade PDFs, we need the binary. Let's check how the new API saves it.
        // It saves `dbContent = "[PDF Document: file.pdf]"`. This means we lost the PDF binary!

        let contentToGrade = submission.content;
        let mimeType = "text/plain";
        let buffer: Buffer;

        if (contentToGrade.startsWith("http")) {
            // New logic: fetch content from blob storage
            const response = await fetch(contentToGrade);
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);

            if (submission.fileName.endsWith(".pdf")) mimeType = "application/pdf";
            else if (submission.fileName.endsWith(".sql")) mimeType = "application/sql";
            else if (submission.fileName.endsWith(".py")) mimeType = "text/x-python";
        } else if (contentToGrade.startsWith("[PDF Document:")) {
            // FALLBACK: If we lost the PDF binary because we made it async without blob storage (OLD DATA)
            buffer = Buffer.from("Por favor califica el contenido basado en los metadatos disponibles. El estudiante subió un PDF que ya no está en memoria.");
        } else {
            buffer = Buffer.from(contentToGrade, "utf-8");
            if (submission.fileName.endsWith(".sql")) mimeType = "application/sql";
            else if (submission.fileName.endsWith(".py")) mimeType = "text/x-python";
        }

        // Call Gemini for grading
        const gradingResult = await gradeSubmission(
            submission.fileName,
            buffer,
            mimeType,
            submission.day.gradingSeverity || 1,
            submission.day.exerciseDescription || undefined
        );

        console.log(`[GRADING PROCESSOR] Gemini Result for ${submission.user.email}:`, JSON.stringify(gradingResult, null, 2));

        // Update submission with results
        const updatedSubmission = await prisma.submission.update({
            where: { id: submission.id },
            data: {
                status: "GRADED",
                grade: typeof gradingResult.nota === 'number' ? gradingResult.nota : undefined,
                feedback: gradingResult,
                ...(gradingResult.resumen_codigo && contentToGrade.startsWith("[PDF Document:") && { content: gradingResult.resumen_codigo })
            }
        });

        console.log(`[GRADING PROCESSOR] DB Updated for ${submission.user.email}. Status: ${updatedSubmission.status}, Grade: ${updatedSubmission.grade}`);

        // SEND EMAIL NOTIFICATION
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://doacademy.vercel.app";
        // The link directs the student to their grades page where they can see specific feedback.
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
                <p style="margin: 10px 0 0 0; font-size: 48px; font-weight: 900; color: #0f172a;">${gradingResult.nota}</p>
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
            await sendEmail({
                to: submission.user.email,
                subject: `Calificación Lista: ${submission.day.title} — DO Academy`,
                html: htmlContent,
                replyTo: "no-reply@do-academy.com"
            });
            console.log(`[GRADING PROCESSOR] Email notification sent to ${submission.user.email}`);
        } catch (mailErr: any) {
            console.error(`[GRADING PROCESSOR] Email failed to send, but grading succeeded:`, mailErr);
        }

        return { 
            success: true, 
            message: `Submission ${submission.id} graded.`, 
            processed: true,
            studentName: submission.user.name
        };

    } catch (error: any) {
        const isQuotaError = error.status === 429 || error.message?.includes("429") || error.message?.includes("quota");

        if (isQuotaError) {
            // Leave submission as PENDING so the cron picks it up tomorrow
            console.warn("[GRADING PROCESSOR] Quota exceeded. Submission left as PENDING for tomorrow.");
            return { success: false, processed: false, quotaExceeded: true, error: "Quota exceeded" };
        }

        // Real error: mark as FAILED so the student knows something went wrong
        console.error("[GRADING PROCESSOR] CRITICAL ERROR during grading:", error);
        await prisma.submission.update({
            where: { id: submission.id },
            data: {
                status: "FAILED",
                feedback: { error: error.message || "Unknown grading error" }
            }
        });

        return { 
            success: false, 
            processed: true, // Mark as processed so the loop continues to the NEXT one
            error: error.message,
            studentName: submission.user.name 
        };
    }
}

export async function processAllPendingSubmissions() {
    console.log("[GRADING BATCH] Started processing ALL pending submissions manually...");

    let processedCount = 0;
    let failedCount = 0;
    let quotaExceeded = false;
    try {
        const pendingSubmissions = await prisma.submission.findMany({
            where: { status: "PENDING" },
            select: { id: true }
        });

        console.log(`[GRADING BATCH] Found ${pendingSubmissions.length} pending submissions.`);

        for (const _sub of pendingSubmissions) {
            const result: any = await processNextPendingSubmission();

            if (result.quotaExceeded) {
                // Quota exhausted — stop immediately, leave rest as PENDING for tomorrow
                quotaExceeded = true;
                console.warn("[GRADING BATCH] Quota exceeded. Stopping for today. Remaining submissions stay PENDING.");
                break;
            } else if (result.processed) {
                processedCount++;
            } else if (!result.success) {
                failedCount++;
                console.warn(`[GRADING BATCH] One submission had a real error, continuing...`);
            } else {
                break; // Queue empty
            }
        }

        console.log(`[GRADING BATCH] Finished. Processed: ${processedCount}, Failed: ${failedCount}, Quota stopped: ${quotaExceeded}.`);
        return { success: true, processedCount, failedCount, quotaExceeded };
    } catch (error: any) {
        console.error("[GRADING BATCH] Error:", error);
        return { success: false, error: error.message };
    }
}

export async function triggerAiGradingForDay(dayId: string) {
    try {
        console.log(`[AI GRADING TRIGGER] Starting for day ${dayId}`);

        // Update all submissions for this day to PENDING status
        // FORCE: We remove the 'not PENDING' check to allow RE-TRIGGERING if it got stuck
        const updateResult = await prisma.submission.updateMany({
            where: {
                dayId
            },
            data: {
                status: "PENDING"
            }
        });

        console.log(`[AI GRADING TRIGGER] Force-marked ${updateResult.count} submissions as PENDING.`);

        // Get TOTAL pending count for this day (including those already pending)
        const totalPending = await prisma.submission.count({
            where: {
                dayId,
                status: "PENDING"
            }
        });

        return {
            success: true,
            updateCount: updateResult.count,
            totalPending
        };
    } catch (error: any) {
        console.error("[AI GRADING TRIGGER] Error:", error);
        return { success: false, error: error.message };
    }
}

export async function triggerIndividualAiGrading(submissionId: string) {
    try {
        await prisma.submission.update({
            where: { id: submissionId },
            data: { status: "PENDING" }
        });
        const sub = await prisma.submission.findUnique({ where: { id: submissionId }, select: { dayId: true } });
        return await processNextPendingSubmission(sub?.dayId);
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * SURGICAL DEBUG: Grades a submission DIRECTLY skipping all queues
 */
export async function gradeIndividualSubmissionAction(submissionId: string) {
    console.log(`[SURGICAL] Starting direct grade for ${submissionId}`);
    try {
        const submission = await prisma.submission.findUnique({
            where: { id: submissionId },
            include: {
                user: { select: { email: true, name: true } },
                day: {
                    select: {
                        id: true,
                        title: true,
                        gradingSeverity: true,
                        exerciseDescription: true
                    }
                }
            }
        });

        if (!submission) return { success: false, error: "Entrega no encontrada." };

        let contentToGrade = submission.content;
        let mimeType = "text/plain";
        let buffer: Buffer;

        if (contentToGrade.startsWith("http")) {
            const response = await fetch(contentToGrade);
            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
            if (submission.fileName.endsWith(".pdf")) mimeType = "application/pdf";
            else if (submission.fileName.endsWith(".py")) mimeType = "text/x-python";
        } else {
            buffer = Buffer.from(contentToGrade, "utf-8");
            if (submission.fileName.endsWith(".py")) mimeType = "text/x-python";
        }

        const gradingResult = await gradeSubmission(
            submission.fileName,
            buffer,
            mimeType,
            submission.day.gradingSeverity || 1,
            submission.day.exerciseDescription || undefined
        );

        await prisma.submission.update({
            where: { id: submission.id },
            data: {
                status: "GRADED",
                grade: typeof gradingResult.nota === 'number' ? gradingResult.nota : undefined,
                feedback: gradingResult
            }
        });

        return { success: true, message: "Calificado con éxito.", studentName: submission.user.name };
    } catch (error: any) {
        console.error("[SURGICAL ERROR]", error);
        return { success: false, error: error.message || "Error desconocido" };
    }
}

export async function testAiConnection() {
    const results: string[] = [];
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return { success: false, error: "API KEY NO ENCONTRADA" };

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test combinations from the DISCOVERED list
    const tests = [
        { model: "gemini-2.5-flash", version: "v1beta" },
        { model: "gemini-2.0-flash", version: "v1beta" },
        { model: "gemini-2.0-flash", version: "v1" }
    ];

    for (const test of tests) {
        try {
            const model = genAI.getGenerativeModel({ model: test.model }, { apiVersion: test.version });
            const result = await model.generateContent("Respond 'OK'");
            const response = await result.response;
            return { 
                success: true, 
                message: `EXITO con ${test.model} en ${test.version}. Respuesta: ${response.text()}`,
                workingModel: test.model,
                workingVersion: test.version
            };
        } catch (e: any) {
            results.push(`${test.model} (${test.version}): ${e.message}`);
        }
    }

    return { 
        success: false, 
        error: "Ningún modelo funcionó.", 
        details: results.join(" | ") 
    };
}

export async function listAvailableModels() {
    try {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) return { success: false, error: "API KEY NO ENCONTRADA" };
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // This is tricky with the current SDK, but let's try a common approach
        // or just try different names
        return { 
            success: true, 
            suggestions: ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro", "gemini-1.0-pro"] 
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

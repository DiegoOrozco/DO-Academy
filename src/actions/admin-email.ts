"use server";

import prisma from "@/lib/prisma";
import { ensureAdmin } from "@/lib/auth-guards";
import { sendEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function sendMassEmail(formData: FormData) {
    await ensureAdmin();

    const subject = formData.get("subject") as string;
    const content = formData.get("content") as string;
    const targetCourseId = formData.get("courseId") as string; // Optional filtering

    if (!subject || !content) {
        throw new Error("Asunto y contenido son obligatorios");
    }

    // Fetch target student emails
    let students;
    if (targetCourseId && targetCourseId !== "all") {
        students = await prisma.user.findMany({
            where: {
                role: "STUDENT",
                enrollments: { some: { courseId: targetCourseId, status: "ACTIVE" } }
            },
            select: { email: true }
        });
    } else {
        students = await prisma.user.findMany({
            where: { role: "STUDENT" },
            select: { email: true }
        });
    }

    const emails = students.map(s => s.email);

    if (emails.length === 0) {
        return { success: false, message: "No hay estudiantes registrados para recibir el correo." };
    }

    // Formatting HTML for a professional look
    const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #3b82f6;">DO Academy - Comunicado</h2>
      <div style="line-height: 1.6; color: #333; font-size: 16px;">
        ${content.replace(/\n/g, '<br>')}
      </div>
      <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #999; text-align: center;">
        Estás recibiendo este correo porque eres estudiante en DO Academy.
      </p>
    </div>
  `;

    // Sending emails (in production, for very large sets, this should be a background job)
    // For small/medium groups, direct send works fine.
    try {
        await sendEmail({
            to: emails,
            subject: subject,
            html: htmlContent
        });

        revalidatePath("/admin/communications");
        return { success: true, count: emails.length };
    } catch (error: any) {
        console.error("Error sending mass email:", error);
        throw new Error("Error al enviar los correos: " + error.message);
    }
}

export async function getCoursesList() {
    await ensureAdmin();
    return await prisma.course.findMany({
        select: { id: true, title: true }
    });
}

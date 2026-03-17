"use server";

import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export async function resendVerificationEmail(email: string) {
    if (!email) return { success: false, error: "Correo electrónico requerido" };

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return { success: false, error: "Usuario no encontrado" };
        }

        if (user.emailVerified) {
            return { success: false, error: "Este correo ya está verificado" };
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");
        
        await prisma.user.update({
            where: { id: user.id },
            data: { verificationToken }
        });

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://doacademy.vercel.app";
        const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;

        const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #10b981;">Verifica tu cuenta — DO Academy</h2>
                <p>Hola ${user.name},</p>
                <p>Has solicitado un nuevo enlace de verificación. Haz clic en el siguiente enlace para completar tu registro:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Verificar mi cuenta
                    </a>
                </div>
                <p>Si no realizaste esta solicitud, puedes ignorar este correo.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #666;">DO Academy - Comunidad de aprendizaje</p>
            </div>
        `;

        await sendEmail({
            to: email,
            subject: "Nuevo enlace de verificación — DO Academy",
            html: htmlContent
        });

        return { success: true, message: "Correo de verificación reenviado con éxito" };
    } catch (error: any) {
        console.error("Resend verification error:", error);
        return { success: false, error: "Error al reenviar el correo" };
    }
}

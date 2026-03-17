"use server";

import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-utils";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
    const user = await getAuthUser();
    if (!user) return { success: false, error: "No autorizado" };

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    if (!name || name.trim().length === 0) {
        return { success: false, error: "El nombre es obligatorio" };
    }

    try {
        const currentUser = await prisma.user.findUnique({
            where: { id: user.id }
        });

        if (!currentUser) return { success: false, error: "Usuario no encontrado" };

        let emailChangeMessage = "";
        let emailNeedsVerification = false;

        // Update name
        await prisma.user.update({
            where: { id: user.id },
            data: { name }
        });

        // Handle email change
        if (email && email !== currentUser.email) {
            if (currentUser.googleId) {
                return { success: false, error: "No puedes cambiar el correo de una cuenta vinculada a Google" };
            }

            // Check if new email is already in use
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return { success: false, error: "Este correo ya está en uso por otra cuenta" };
            }

            const verificationToken = crypto.randomBytes(32).toString("hex");
            
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    pendingEmail: email,
                    verificationToken
                }
            });

            // Send verification email
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://doacademy.vercel.app";
            const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;

            const htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #3b82f6;">Verifica tu nuevo correo electrónico</h2>
                    <p>Hola ${name},</p>
                    <p>Has solicitado cambiar tu correo electrónico en DO Academy. Para completar este proceso, por favor haz clic en el siguiente enlace:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Verificar mi nuevo correo
                        </a>
                    </div>
                    <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">DO Academy - Comunidad de aprendizaje</p>
                </div>
            `;

            await sendEmail({
                to: email,
                subject: "Confirma tu nuevo correo — DO Academy",
                html: htmlContent
            });

            emailNeedsVerification = true;
            emailChangeMessage = "Se ha enviado un correo de verificación a tu nueva dirección. Por favor, confírmalo para completar el cambio.";
        }

        revalidatePath("/profile");
        return { 
            success: true, 
            message: emailNeedsVerification ? emailChangeMessage : "Perfil actualizado correctamente",
            emailNeedsVerification
        };

    } catch (error: any) {
        console.error("Profile update error:", error);
        return { success: false, error: "Error al actualizar el perfil" };
    }
}

export async function verifyNewEmail(token: string) {
    if (!token) return { success: false, error: "Token no proporcionado" };

    try {
        const user = await prisma.user.findUnique({
            where: { verificationToken: token }
        });

        if (!user) {
            return { success: false, error: "Enlace de verificación inválido o expirado" };
        }

        // If pendingEmail exists, it's an email change. Otherwise it's initial registration.
        const newEmail = user.pendingEmail || user.email;

        await prisma.user.update({
            where: { id: user.id },
            data: {
                email: newEmail,
                pendingEmail: null,
                verificationToken: null,
                emailVerified: true
            }
        });

        return { success: true, message: "Correo verificado y actualizado con éxito" };
    } catch (error: any) {
        console.error("Verification error:", error);
        return { success: false, error: "Error durante la verificación" };
    }
}

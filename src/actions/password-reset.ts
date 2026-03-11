"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail, transporter } from "@/lib/email";
import { redirect } from "next/navigation";

console.log(`[INIT] Módulo password-reset.ts cargado correctamente.`);

export async function testEmailConfig() {
  console.log(`[DIAGNOSTIC] Verificando configuración de correo...`);
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS ? "CONFIGURADA (SI)" : "NOT FOUND (NO)";
  console.log(`[DIAGNOSTIC] EMAIL_USER: ${emailUser ? emailUser.substring(0, 3) + '...' : 'MISSING'}`);
  console.log(`[DIAGNOSTIC] EMAIL_PASS: ${emailPass}`);

  try {
    await transporter.verify();
    console.log(`[DIAGNOSTIC] Conexión SMTP verificada con éxito.`);
    return { success: true, message: "SMTP connection OK" };
  } catch (error: any) {
    console.error(`[DIAGNOSTIC] Fallo en verificación SMTP:`, error);
    return { success: false, error: error.message };
  }
}

export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  console.log(`[DEBUG-AUTH] Solicitud RECIBIDA para restablecer contraseña de: ${email}`);

  if (!email) {
    console.warn(`[DEBUG-AUTH] Email no proporcionado en el formulario.`);
    redirect("/forgot-password?error=missing");
  }

  // Always show success to prevent email enumeration attacks
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log(`[DEBUG-AUTH] Usuario NO encontrado en la base de datos: ${email}`);
      // No hacemos nada más, dejamos que redirija a "sent=true" por seguridad
    } else if (user.googleId) {
      console.log(`[DEBUG-AUTH] El usuario ${email} utiliza Google Auth (GoogleID: ${user.googleId}). No se envía enlace de reset.`);
      // No enviamos reset para cuentas de Google
    } else {
      console.log(`[DEBUG-AUTH] Usuario encontrado: ${user.name} (ID: ${user.id}). Generando token...`);

      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: token,
          resetTokenExpiry: expiry,
        },
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      console.log(`[DEBUG-AUTH] Token guardado. Iniciando envío de correo vía sendEmail...`);

      const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #ffffff;">
              <h2 style="color: #3b82f6; margin-bottom: 20px;">DO Academy - Recuperación de Contraseña</h2>
              <div style="line-height: 1.6; color: #333; font-size: 16px; margin-bottom: 30px;">
                Hola <strong>${user.name}</strong>,<br><br>
                Recibimos una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para continuar:
              </div>
              <div style="text-align: center; margin-bottom: 35px;">
                <a href="${resetLink}" style="display: inline-block; padding: 14px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Restablecer Contraseña
                </a>
              </div>
              <div style="padding: 15px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 25px;">
                <p style="margin: 0; font-size: 13px; color: #4b5563;">
                  <strong>Enlace alternativo:</strong> Si el botón no funciona, copia y pega esta URL en tu navegador:<br>
                  <span style="word-break: break-all; color: #3b82f6;">${resetLink}</span>
                </p>
              </div>
              <div style="padding: 10px; border-radius: 6px; background-color: #fff7ed; border: 1px solid #ffedd5;">
                <p style="margin: 0; font-size: 12px; color: #9a3412;">
                  Este enlace expirará en 1 hora por seguridad. Si no solicitaste este cambio, puedes ignorar este mensaje.
                </p>
              </div>
              <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
              <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 20px;">
                &copy; ${new Date().getFullYear()} DO Academy - Todos los derechos reservados.
              </p>
            </div>
          `;

      await sendEmail({
        to: user.email,
        subject: "Recupera tu contraseña — DO Academy",
        html: htmlContent,
        replyTo: "no-reply@do-academy.com"
      });
      console.log(`[DEBUG-AUTH] Correo ENVIADO correctamente a ${user.email}`);
    }
  } catch (error: any) {
    if (error.digest?.includes("NEXT_REDIRECT")) throw error;
    console.error("[DEBUG-AUTH] ERROR FATAL en requestPasswordReset:", error);
  }

  console.log(`[DEBUG-AUTH] Finalizando proceso, redirigiendo a éxito.`);
  redirect("/forgot-password?sent=true");
}

export async function resetPassword(formData: FormData) {
  const token = (formData.get("token") as string)?.trim();
  const newPassword = (formData.get("password") as string)?.trim();
  const confirmPassword = (formData.get("confirm") as string)?.trim();

  if (!token || !newPassword) {
    redirect(`/reset-password?token=${token}&error=missing`);
  }

  if (newPassword !== confirmPassword) {
    redirect(`/reset-password?token=${token}&error=mismatch`);
  }

  if (newPassword.length < 6) {
    redirect(`/reset-password?token=${token}&error=short`);
  }

  const user = await prisma.user.findUnique({ where: { resetToken: token } });

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    redirect("/forgot-password?error=expired");
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  redirect("/login?success=password_reset");
}

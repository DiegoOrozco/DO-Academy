"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { redirect } from "next/navigation";

console.log(`[INIT] Módulo password-reset.ts cargado correctamente.`);

export async function testEmailConfig() {
  console.log(`[DIAGNOSTIC] Verificando entorno...`);
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS ? "EXISTE" : "NO EXISTE";
  console.log(`[DIAGNOSTIC] EMAIL_USER: ${emailUser ? emailUser : 'VACIO'}`);
  console.log(`[DIAGNOSTIC] EMAIL_PASS: ${emailPass}`);

  return { success: true };
}

export async function diagnosticSendTestEmail() {
  console.log(`[DIAGNOSTIC] Intentando enviar CORREO DE PRUEBA...`);
  try {
    await sendEmail({
      to: process.env.EMAIL_USER || "admin@example.com",
      subject: "PRUEBA DE DIAGNÓSTICO - DO ACADEMY",
      html: "<b>Esta es una prueba de envío desde el servidor de producción.</b>"
    });
    console.log(`[DIAGNOSTIC] Envío de prueba completado.`);
    return { success: true };
  } catch (error: any) {
    console.error(`[DIAGNOSTIC] Fallo en envío de prueba:`, error);
    return { success: false, error: error.message };
  }
}

export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  console.log(`[DEBUG-AUTH] >>> INICIO PROCESO para: ${email}`);

  if (!email) {
    console.log(`[DEBUG-AUTH] Email vacío.`);
    return { success: false, error: "missing" };
  }

  try {
    console.log(`[DEBUG-AUTH] Buscando en DB...`);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.log(`[DEBUG-AUTH] DB: Usuario no existe.`);
      return { success: true }; // Silent pass for security
    } else if (user.googleId) {
      console.log(`[DEBUG-AUTH] DB: Es cuenta de Google (${user.googleId})`);
      return { success: true }; // Silent pass for security
    } else {
      console.log(`[DEBUG-AUTH] DB: Usuario encontrado (${user.name}). Generando token...`);
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 1000 * 60 * 60);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: token,
          resetTokenExpiry: expiry,
        },
      });
      console.log(`[DEBUG-AUTH] DB: Token guardado.`);

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      console.log(`[DEBUG-AUTH] Llamando a sendEmail...`);

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
              <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
              <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 20px;">
                &copy; ${new Date().getFullYear()} DO Academy - Todos los derechos reservados.
              </p>
            </div>
          `;

      try {
        await sendEmail({
          to: user.email,
          subject: "Recupera tu contraseña — DO Academy",
          html: htmlContent,
          replyTo: "no-reply@do-academy.com"
        });
        console.log(`[DEBUG-AUTH] sendEmail RETORNÓ con éxito.`);
      } catch (mailErr: any) {
        console.error(`[DEBUG-AUTH] sendEmail FALLÓ:`, mailErr);
        return { success: false, error: "fallo-envio" };
      }
    }
    return { success: true };
  } catch (error: any) {
    console.error("[DEBUG-AUTH] ERROR FATAL en requestPasswordReset:", error);
    return { success: false, error: "fatal" };
  }
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

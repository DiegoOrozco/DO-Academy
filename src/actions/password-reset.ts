"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { redirect } from "next/navigation";

export async function requestPasswordReset(formData: FormData) {
    const email = (formData.get("email") as string)?.toLowerCase().trim();

    if (!email) {
        redirect("/forgot-password?error=missing");
    }

    // Always show success to prevent email enumeration attacks
    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (user && !user.googleId) {
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

            await sendEmail({
                to: user.email,
                subject: "Recupera tu contraseña — DO Academy",
                html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#0a0d16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 20px;">
    <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,rgba(59,130,246,0.15),rgba(16,185,129,0.08));padding:40px 40px 32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.05);">
        <div style="display:inline-block;background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);border-radius:16px;padding:12px 20px;margin-bottom:20px;">
          <span style="color:#3B82F6;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;">DO Academy</span>
        </div>
        <h1 style="color:#ffffff;font-size:26px;font-weight:900;margin:0 0 8px;letter-spacing:-0.02em;">Recupera tu contraseña</h1>
        <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0;">Recibimos una solicitud para restablecer tu contraseña.</p>
      </div>
      <!-- Body -->
      <div style="padding:40px;">
        <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.6;margin:0 0 28px;">Hola <strong style="color:#fff;">${user.name}</strong>,</p>
        <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.6;margin:0 0 32px;">Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace expirará en <strong style="color:#fff;">1 hora</strong>.</p>
        
        <div style="text-align:center;margin-bottom:32px;">
          <a href="${resetLink}" style="display:inline-block;background:#3B82F6;color:#ffffff;font-size:15px;font-weight:900;text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.05em;">
            Restablecer Contraseña →
          </a>
        </div>
        
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px;margin-bottom:28px;">
          <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.1em;">O copia este enlace en tu navegador:</p>
          <p style="color:#3B82F6;font-size:11px;margin:0;word-break:break-all;">${resetLink}</p>
        </div>
        
        <p style="color:rgba(255,255,255,0.3);font-size:12px;line-height:1.5;margin:0;">Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña actual seguirá siendo válida.</p>
      </div>
      <!-- Footer -->
      <div style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
        <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;">DO Academy · Todos los derechos reservados</p>
      </div>
    </div>
  </div>
</body>
</html>
                `,
            });
        }
    } catch (error: any) {
        if (error.digest?.includes("NEXT_REDIRECT")) throw error;
        console.error("Password reset request error:", error);
    }

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

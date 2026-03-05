import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY || "re_dummy_key_for_build";
const resend = new Resend(apiKey);

export async function sendVerificationEmail(email: string, token: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const confirmLink = `${baseUrl}/verify-email?token=${token}`;

    await resend.emails.send({
        from: "DO Academy <onboarding@resend.dev>", // Replace with your verified domain later
        to: email,
        subject: "Verifica tu correo - DO Academy",
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #1313ec;">¡Bienvenido a DO Academy!</h2>
                <p>Para comenzar tu aventura en la programación, por favor verifica tu correo haciendo clic en el siguiente botón:</p>
                <a href="${confirmLink}" style="display: inline-block; padding: 12px 24px; background-color: #1313ec; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Verificar Correo</a>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 10px; color: #999;">DO Academy - Tecnología de forma estructurada y práctica.</p>
            </div>
        `
    });
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    await resend.emails.send({
        from: "DO Academy <onboarding@resend.dev>",
        to: email,
        subject: "Restablece tu contraseña - DO Academy",
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #1313ec;">Restablecer Contraseña</h2>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para continuar:</p>
                <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #1313ec; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Restablecer Contraseña</a>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">Este enlace expirará en 1 hora. Si no solicitaste esto, ignora el correo.</p>
            </div>
        `
    });
}

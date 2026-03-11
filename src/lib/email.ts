import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, html, replyTo }: { to: string | string[]; subject: string; html: string; replyTo?: string }) {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    console.log(`[EMAIL-SERVICE] Iniciando envío a: ${to} (Asunto: ${subject})`);

    if (!emailUser || !emailPass) {
        console.error(`[EMAIL-SERVICE] ERROR: Variables de entorno faltantes (User: ${emailUser ? 'SI' : 'NO'}, Pass: ${emailPass ? 'SI' : 'NO'})`);
        throw new Error("Configuración de correo incompleta (EMAIL_USER / EMAIL_PASS)");
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: emailUser,
            pass: emailPass,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"DO Academy" <${emailUser}>`,
            to,
            subject,
            html,
            replyTo: replyTo || emailUser,
        });

        console.log(`[EMAIL-SERVICE] ÉXITO: Correo enviado. ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[EMAIL-SERVICE] ERROR FATAL en transporter.sendMail:`, error);
        throw error;
    }
}

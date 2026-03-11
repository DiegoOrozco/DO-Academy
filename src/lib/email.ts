import nodemailer from "nodemailer";

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: emailUser,
        pass: emailPass,
    },
});

export async function sendEmail({ to, subject, html, replyTo }: { to: string | string[]; subject: string; html: string; replyTo?: string }) {
    console.log(`[EMAIL-SERVICE] Intento de envío a: ${to} (Asunto: ${subject})`);

    if (!emailUser || !emailPass) {
        console.error(`[EMAIL-SERVICE] ERROR: Credentials missing (User: ${emailUser ? 'YES' : 'NO'}, Pass: ${emailPass ? 'YES' : 'NO'})`);
        throw new Error("Configuración de correo incompleta (EMAIL_USER / EMAIL_PASS)");
    }

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
        console.error(`[EMAIL-SERVICE] ERROR al enviar via Nodemailer:`, error);
        throw error;
    }
}

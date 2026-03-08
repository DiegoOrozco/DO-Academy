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
    if (!emailUser || !emailPass) {
        throw new Error("Configuración de correo incompleta (EMAIL_USER / EMAIL_PASS)");
    }

    const info = await transporter.sendMail({
        from: `"DO Academy" <${emailUser}>`,
        to,
        subject,
        html,
        replyTo: replyTo || emailUser,
    });

    return info;
}

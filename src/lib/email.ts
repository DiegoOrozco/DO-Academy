import nodemailer from "nodemailer";

let transporter: any = null;

function getTransporter() {
    if (!transporter) {
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;
        if (!emailUser || !emailPass) return null;

        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: emailUser,
                pass: emailPass,
            },
        });
    }
    return transporter;
}

export async function sendEmail({ to, subject, html, replyTo }: { to: string | string[]; subject: string; html: string; replyTo?: string }) {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    console.log(`[EMAIL-SERVICE] Iniciando envío a: ${to} (Asunto: ${subject})`);

    if (!emailUser || !emailPass) {
        console.error(`[EMAIL-SERVICE] ERROR: Variables de entorno faltantes (User: ${emailUser ? 'SI' : 'NO'}, Pass: ${emailPass ? 'SI' : 'NO'})`);
        throw new Error("Configuración de correo incompleta (EMAIL_USER / EMAIL_PASS)");
    }

    const currentTransporter = getTransporter();
    if (!currentTransporter) {
        throw new Error("No se pudo crear el transporter de correo.");
    }

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const info = await currentTransporter.sendMail({
                from: `"DO Academy" <${emailUser}>`,
                to,
                subject,
                html,
                replyTo: replyTo || emailUser,
            });

            console.log(`[EMAIL-SERVICE] ÉXITO: Correo enviado en el intento ${attempts + 1}. ID: ${info.messageId}`);
            return info;
        } catch (error: any) {
            attempts++;
            console.error(`[EMAIL-SERVICE] ERROR en intento ${attempts}/${maxAttempts}:`, error.message || error);
            
            if (attempts >= maxAttempts) {
                console.error(`[EMAIL-SERVICE] ERROR FATAL tras ${maxAttempts} intentos.`);
                throw error;
            }

            // Esperar antes de reintentar (1s, 2s...)
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
        }
    }
}

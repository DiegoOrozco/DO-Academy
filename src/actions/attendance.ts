"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { markAttendance } from "@/lib/google-sheets";
import { getSheetsClient } from "@/lib/google-auth";
import { getAuthUser } from "@/lib/auth-utils";

// Helper to get sheets client for reading student list
async function getSheets() {
    return getSheetsClient(true);
}

export async function getStudentList(sheetName: string) {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    if (!spreadsheetId) {
        return { success: false, error: "Falta configurar GOOGLE_SHEETS_ID en Vercel." };
    }

    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
        return { success: false, error: "Falta configurar GOOGLE_SHEETS_CLIENT_EMAIL." };
    }

    try {
        const sheets = await getSheets();
        const range = `'${sheetName}'!C2:C200`;

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return {
                success: false,
                error: `No se encontraron datos en la columna C. ¿Seguro que la hoja se llama '${sheetName}'?`,
                debug: `Range attempted: ${range}`
            };
        }

        const students = rows.map((row: any) => row[0]).filter(Boolean);
        return { success: true, data: students };
    } catch (error: any) {
        console.error("Error fetching students:", error);

        let errorMsg = "Error al conectar con Google Sheets.";
        if (error.message?.includes("not found")) errorMsg = `No se encontró la hoja '${sheetName}'.`;
        if (error.message?.includes("permission denied")) errorMsg = "Permiso denegado. Revisa si compartiste el Excel con el correo del Bot.";
        if (error.message?.includes("invalid_grant")) errorMsg = "Error de autenticación. La clave privada es incorrecta.";

        // Si no es un error conocido, mostrar el mensaje técnico para debugear
        if (error.message?.includes("DECODER routines")) {
            const raw = process.env.GOOGLE_SHEETS_PRIVATE_KEY || "";
            const len = raw.length;
            const start = raw.substring(0, 15);
            const end = raw.substring(raw.length - 15);
            errorMsg = `Llave Inválida (Len:${len}). Empieza con: [${start}] Termina con: [${end}]. Asegúrate de usar el formato de Vercel sugerido.`;
        } else if (errorMsg === "Error al conectar con Google Sheets.") {
            errorMsg = `Error de conexión: ${error.message || "Error desconocido"}`;
        }

        return {
            success: false,
            error: errorMsg,
            debug: error.message
        };
    }
}

export async function createAttendanceSession(sheetName: string) {
    // Generate a random 5-character code
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Deactivate old sessions
    await prisma.attendanceSession.updateMany({
        where: { active: true },
        data: { active: false }
    });

    const session = await prisma.attendanceSession.create({
        data: {
            code,
            expiresAt,
            sheetName,
            active: true,
        }
    });

    revalidatePath("/admin/attendance");
    return session;
}

export async function getActiveSession() {
    const session = await prisma.attendanceSession.findFirst({
        where: {
            active: true,
            expiresAt: { gt: new Date() }
        }
    });
    return session;
}

export async function getTodayAttendanceLog(sheetName: string) {
    const user = await getAuthUser();
    if (!user) return null;

    const dateText = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    return await prisma.attendanceLog.findUnique({
        where: {
            userId_dateText_sheetName: {
                userId: user.id,
                dateText,
                sheetName
            }
        }
    });
}

export async function submitStudentAttendance(studentName: string, code: string) {
    const authUser = await getAuthUser();
    if (!authUser) {
        return { success: false, error: "Debes iniciar sesión para registrar asistencia." };
    }

    const session = await getActiveSession();

    if (!session) {
        return { success: false, error: "No hay ninguna sesión de asistencia activa o la clave expiró." };
    }

    if (session.code !== code.toUpperCase()) {
        return { success: false, error: "La clave de asistencia es incorrecta." };
    }

    const dateText = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    try {
        // Find existing today's log for this user & sheet
        const existingLog = await prisma.attendanceLog.findUnique({
            where: {
                userId_dateText_sheetName: {
                    userId: authUser.id,
                    dateText,
                    sheetName: session.sheetName
                }
            }
        });

        if (!existingLog) {
            // STEP 1: First check-in
            if (!studentName) {
                return { success: false, error: "Debes seleccionar tu nombre para el primer check-in." };
            }

            await prisma.attendanceLog.create({
                data: {
                    userId: authUser.id,
                    studentName,
                    dateText,
                    sheetName: session.sheetName,
                    checkIns: 1,
                    firstSessionId: session.id
                }
            });

            return {
                success: true,
                step: 1,
                message: "¡Primer check-in registrado! Recuerda volver al final de la clase para confirmar tu asistencia."
            };
        }

        if (existingLog.checkIns === 1) {
            // STEP 2: Second check-in
            // BUG FIX: Ensure the student isn't reusing the SAME session code
            if (existingLog.firstSessionId === session.id) {
                return {
                    success: false,
                    error: "Ya realizaste el primer check-in con este código. Para el segundo check-in debes esperar al siguiente código (ciclo de 5 min)."
                };
            }

            // Overwrite studentName with the one securely locked in DB to avoid switching
            const verifiedStudentName = existingLog.studentName;

            // Finally, write to Google Sheets
            await markAttendance(verifiedStudentName, session.sheetName);

            // Mark as fully completed in DB
            await prisma.attendanceLog.update({
                where: { id: existingLog.id },
                data: { checkIns: 2 }
            });

            return {
                success: true,
                step: 2,
                message: "¡Asistencia registrada con éxito! Ya puedes cerrar esta ventana."
            };
        }

        if (existingLog.checkIns >= 2) {
            return {
                success: false,
                error: "Ya completaste ambos check-ins hoy. ¡Tu asistencia ya está registrada!"
            };
        }

        return { success: false, error: "Estado de asistencia inválido." };

    } catch (error: any) {
        console.error("Attendance Error:", error);
        return { success: false, error: error.message || "Error al registrar la asistencia." };
    }
}

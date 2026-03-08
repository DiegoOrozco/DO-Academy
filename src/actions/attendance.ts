"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { markAttendance } from "@/lib/google-sheets";
import { google } from "googleapis";

// Helper to get sheets client for reading student list
async function getSheets() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });
    return google.sheets({ version: "v4", auth });
}

export async function getStudentList(sheetName: string) {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    if (!spreadsheetId) {
        console.error("GOOGLE_SHEETS_ID target is missing");
        return [];
    }

    try {
        const sheets = await getSheets();
        // Quote sheet name in case it's numeric or has spaces
        const range = `'${sheetName}'!C2:C200`;

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.warn(`No data found in range: ${range}`);
            return [];
        }

        // Filter out empty rows and numbers if they are separate
        return rows.map(row => row[0]).filter(Boolean);
    } catch (error: any) {
        console.error("Error fetching students from sheet:", error.message || error);
        return [];
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

export async function submitStudentAttendance(studentName: string, code: string) {
    const session = await getActiveSession();

    if (!session) {
        return { success: false, error: "No hay ninguna sesión de asistencia activa o la clave expiró." };
    }

    if (session.code !== code.toUpperCase()) {
        return { success: false, error: "La clave de asistencia es incorrecta." };
    }

    try {
        await markAttendance(studentName, session.sheetName);
        return { success: true };
    } catch (error: any) {
        console.error("Attendance Error:", error);
        return { success: false, error: error.message || "Error al actualizar la hoja de Excel." };
    }
}

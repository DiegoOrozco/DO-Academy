import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n").replace(/"/g, "").trim(),
        },
        scopes: SCOPES,
    });

    return google.sheets({ version: "v4", auth });
}

export async function markAttendance(studentName: string, sheetName: string) {
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    if (!spreadsheetId) throw new Error("GOOGLE_SHEETS_ID not configured");

    const sheets = await getSheetsClient();

    // 1. Get the sheet data to find Row (Student) and Column (Date)
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:Z100`, // Adjust range if more columns/rows are needed
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) throw new Error("Sheet is empty or not found");

    const headerRow = rows[0];
    const studentDataRows = rows.slice(1);

    // 2. Find Student Row (Column C is index 2)
    const NAME_COL_INDEX = 2;
    const studentRowIndex = studentDataRows.findIndex(row =>
        row[NAME_COL_INDEX]?.trim().toLowerCase() === studentName.trim().toLowerCase()
    );

    if (studentRowIndex === -1) {
        throw new Error(`Estudiante "${studentName}" no encontrado en la hoja.`);
    }

    // 3. Find Today's Column (Headers starting from Column G, index 6)
    // The dates in headers are like "5/3/2026"
    const now = new Date();
    // Format to match sheet (Day/Month/Year or Month/Day/Year depends on user localization)
    // Based on image: 5/3/2026, 6/3/2026. This looks like D/M/YYYY or M/D/YYYY.
    // Let's try to match by partial match or specific format.
    const todayStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    let dateColIndex = -1;
    for (let i = 6; i < headerRow.length; i++) {
        const headerDate = headerRow[i]?.trim();
        // Simple string match. We might need a more robust date parser if formats vary.
        if (headerDate === todayStr || headerDate?.startsWith(todayStr)) {
            dateColIndex = i;
            break;
        }
    }

    if (dateColIndex === -1) {
        throw new Error(`No se encontró la columna para la fecha de hoy (${todayStr}).`);
    }

    // 4. Update the cell
    const cellRef = `${String.fromCharCode(65 + dateColIndex)}${studentRowIndex + 2}`;

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${cellRef}`,
        valueInputOption: "RAW",
        requestBody: {
            values: [["1"]],
        },
    });

    return true;
}

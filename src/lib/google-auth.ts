import { google } from "googleapis";

export function formatPrivateKey(key: string | undefined): string | undefined {
    if (!key) return undefined;

    // 1. Clean basic noise (quotes and literal \n)
    let cleaned = key.trim()
        .replace(/^['"`]|['"`]$/g, '') // Remove surrounding quotes
        .replace(/\\n/g, '\n');         // Handle literal \n

    // 2. Normalize PEM structure
    // If it already contains newlines and headers, try to normalize it
    // especially if it was pasted as a single line with spaces in between
    const header = "-----BEGIN PRIVATE KEY-----";
    const footer = "-----END PRIVATE KEY-----";

    if (cleaned.includes(header) && cleaned.includes(footer)) {
        const startIndex = cleaned.indexOf(header) + header.length;
        const endIndex = cleaned.indexOf(footer);
        const base64Content = cleaned.substring(startIndex, endIndex).replace(/\s/g, "");

        // Rebuild the key with standard PEM formatting (64 chars per line)
        const lines = base64Content.match(/.{1,64}/g) || [];
        return `${header}\n${lines.join("\n")}\n${footer}\n`;
    }

    return cleaned;
}

export async function getSheetsClient(readonly = true) {
    const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const key = formatPrivateKey(process.env.GOOGLE_SHEETS_PRIVATE_KEY);

    if (!email || !key) {
        throw new Error("Missing Google Sheets credentials (EMAIL or PRIVATE_KEY)");
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: email,
            private_key: key,
        },
        scopes: readonly
            ? ["https://www.googleapis.com/auth/spreadsheets.readonly"]
            : ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return google.sheets({ version: "v4", auth });
}

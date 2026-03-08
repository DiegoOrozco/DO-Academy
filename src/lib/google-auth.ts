import { google } from "googleapis";

export function formatPrivateKey(key: string | undefined): string | undefined {
    if (!key) return undefined;

    let k = key;
    try {
        const parsed = JSON.parse(k);
        if (parsed.private_key) {
            k = parsed.private_key;
        }
    } catch (e) {
        // Not JSON
    }

    // 1. Remove all quotes and literal \n or actual newlines
    k = k.trim().replace(/^['"`]|['"`]$/g, '').replace(/\\n/g, '').replace(/\n/g, '').replace(/\r/g, '');

    // 2. Identify header and footer
    const header = "-----BEGIN PRIVATE KEY-----";
    const footer = "-----END PRIVATE KEY-----";

    if (k.includes(header) && k.includes(footer)) {
        // Extract JUST the base64 content
        const base64Content = k.substring(
            k.indexOf(header) + header.length,
            k.indexOf(footer)
        ).replace(/\s/g, ""); // Remove any remaining whitespace

        // 3. Re-wrap base64 content into exact 64-character lines
        const match = base64Content.match(/.{1,64}/g);
        if (match) {
            return `${header}\n${match.join("\n")}\n${footer}\n`;
        }
    }

    return k.replace(/\\n/g, '\n');
}

export async function getSheetsClient(readonly = true) {
    const scopes = readonly
        ? ["https://www.googleapis.com/auth/spreadsheets.readonly"]
        : ["https://www.googleapis.com/auth/spreadsheets"];

    // NEW APPROACH: Prefer full JSON object if provided
    if (process.env.GOOGLE_CREDENTIALS) {
        try {
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes,
            });
            return google.sheets({ version: "v4", auth });
        } catch (error: any) {
            console.error("Error parsing GOOGLE_CREDENTIALS JSON:", error);
            throw new Error(`GOOGLE_CREDENTIALS JSON inválido: ${error.message}`);
        }
    }

    // Fallback: Individual variables
    const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const key = formatPrivateKey(process.env.GOOGLE_SHEETS_PRIVATE_KEY);

    if (!email || !key) {
        throw new Error("Faltan las credenciales de Google Sheets. Usa GOOGLE_CREDENTIALS o EMAIL/PRIVATE_KEY.");
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: email.trim(),
            private_key: key,
        },
        scopes,
    });

    return google.sheets({ version: "v4", auth });
}

import { google } from "googleapis";

export function formatPrivateKey(key: string | undefined): string | undefined {
    if (!key) return undefined;

    // 1. Remove ANY type of surrounding quotes (single, double, or backticks)
    let rawKey = key.trim().replace(/^['"`]|['"`]$/g, '');

    // 2. Handle literal backslash-n sequences
    let fixedKey = rawKey.replace(/\\n/g, "\n");

    // 3. Ensure the key starts with the correct header
    if (!fixedKey.includes("-----BEGIN PRIVATE KEY-----")) {
        console.error("Key is missing PEM header");
    }

    return fixedKey;
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

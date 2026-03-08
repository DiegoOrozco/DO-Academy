import { google } from "googleapis";

export function formatPrivateKey(key: string | undefined): string | undefined {
    if (!key) return undefined;

    let k = key;

    // 1. If the user pasted the entire JSON by accident, try to extract just the key
    try {
        const parsed = JSON.parse(k);
        if (parsed.private_key) {
            k = parsed.private_key;
        }
    } catch (e) {
        // Not a JSON, which is fine
    }

    // 2. Clean surrounding quotes that might have been added by Vercel/copy-paste
    k = k.trim().replace(/^['"`]|['"`]$/g, '');

    // 3. Handle literal \n (backslash + n) and replace them with real newlines
    k = k.replace(/\\n/g, '\n');

    return k;
}

export async function getSheetsClient(readonly = true) {
    const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const key = formatPrivateKey(process.env.GOOGLE_SHEETS_PRIVATE_KEY);

    if (!email || !key) {
        throw new Error("Missing Google Sheets credentials (EMAIL or PRIVATE_KEY)");
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: email.trim(),
            private_key: key,
        },
        scopes: readonly
            ? ["https://www.googleapis.com/auth/spreadsheets.readonly"]
            : ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return google.sheets({ version: "v4", auth });
}

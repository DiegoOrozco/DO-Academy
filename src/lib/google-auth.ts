import { google } from "googleapis";

export function formatPrivateKey(key: string | undefined): string | undefined {
    if (!key) return undefined;

    // 1. Remove literal quotes that sometimes appear in Vercel/Env vars
    let rawKey = key.trim();
    if (rawKey.startsWith('"') && rawKey.endsWith('"')) {
        rawKey = rawKey.substring(1, rawKey.length - 1);
    }

    // 2. Handle literal \n (backslash n) strings
    // If the key contains literal '\n', replace them with actual newline characters
    let fixedKey = rawKey.replace(/\\n/g, "\n");

    // 3. Ensure we have actual newlines if it's all in one line but has spaces
    // (Sometimes PEM keys get mangled into one line with spaces instead of newlines)
    // However, if we see -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----
    // but everything in between is one line, we might need to re-wrap.
    // But usually replace(/\\n/g, "\n") is enough for Google Keys.

    return fixedKey.trim();
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

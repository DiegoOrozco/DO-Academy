import CryptoJS from 'crypto-js';

const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-secret-for-dev-only-change-in-prod';

/**
 * Signs a value by appending a HMAC signature
 */
export function signSession(value: string): string {
    const signature = CryptoJS.HmacSHA256(value, SESSION_SECRET).toString();
    return `${value}.${signature}`;
}

/**
 * Verifies a signed session value and returns the original value if valid
 */
export function verifySession(signedValue: string | undefined): string | null {
    if (!signedValue) return null;

    const parts = signedValue.split('.');
    if (parts.length !== 2) return null;

    const [value, signature] = parts;
    const expectedSignature = CryptoJS.HmacSHA256(value, SESSION_SECRET).toString();

    if (signature === expectedSignature) {
        return value;
    }

    return null;
}

import { crypto } from "next/dist/compiled/@edge-runtime/primitives";

/**
 * Timing-safe string comparison to prevent timing attacks on secrets/passwords.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  if (bufA.byteLength !== bufB.byteLength) {
    // Perform dummy comparison to keep constant execution time
    const dummy = new Uint8Array(bufA.byteLength);
    let result = 1;
    for (let i = 0; i < bufA.byteLength; i++) {
      result &= (bufA[i] === dummy[i] ? 1 : 0);
    }
    return false;
  }

  let result = 0;
  for (let i = 0; i < bufA.byteLength; i++) {
    result |= bufA[i] ^ bufB[i];
  }
  return result === 0;
}

/**
 * Simple HMAC token generator & verifier for admin session cookies.
 */
function getSecretKey(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "order-system-secure-fallback-secret-key-2026";
}

export async function createAdminSessionToken(): Promise<string> {
  const secret = getSecretKey();
  const timestamp = Date.now().toString();
  const payload = `admin_session:${timestamp}`;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );

  const hashArray = Array.from(new Uint8Array(signature));
  const hexSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `${payload}.${hexSignature}`;
}

export async function verifyAdminSessionToken(token: string | undefined): Promise<boolean> {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payload, hexSignature] = parts;
  if (!payload.startsWith('admin_session:')) return false;

  const timestampStr = payload.replace('admin_session:', '');
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp)) return false;

  // Max age: 7 days
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) return false;

  const secret = getSecretKey();
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // Convert hex back to Uint8Array
  const sigBytes = new Uint8Array(hexSignature.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);

  const isValid = await globalThis.crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    encoder.encode(payload)
  );

  return isValid;
}

/**
 * Simple in-memory rate limiter for login attempts per IP
 */
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const record = loginAttempts.get(ip);

  if (!record || now > record.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true };
}

export function resetRateLimit(ip: string) {
  loginAttempts.delete(ip);
}

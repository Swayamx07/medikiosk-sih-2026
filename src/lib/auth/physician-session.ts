import crypto from "crypto";
import { cookies } from "next/headers";
export * from "./physician-constants";
import {
  PHYSICIAN_COOKIE_NAME,
  PhysicianProfile,
  PhysicianSessionPayload,
} from "./physician-constants";

// Secret used to sign session cookies. Falls back to a deterministic development key.
const SESSION_SECRET =
  process.env.PHYSICIAN_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "medikiosk-physician-session-secret-key-sih-2026";

/**
 * Signs a session payload string using HMAC-SHA256.
 */
function signPayload(payloadStr: string): string {
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(payloadStr);
  return hmac.digest("base64url");
}

/**
 * Creates a signed session token.
 */
export function createSessionToken(profile: PhysicianProfile): string {
  const payload: PhysicianSessionPayload = {
    ...profile,
    authenticatedAt: new Date().toISOString(),
    expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hour shift session
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies a signed session token. Returns the payload if valid and unexpired, or null.
 */
export function verifySessionToken(
  token?: string | null
): PhysicianSessionPayload | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payloadBase64, signature] = parts;
  const expectedSignature = signPayload(payloadBase64);

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const payload = JSON.parse(jsonStr) as PhysicianSessionPayload;

    if (!payload.expiresAt || Date.now() > payload.expiresAt) {
      return null; // Session expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Server-side helper to read and verify the active physician session from cookies.
 */
export async function getActivePhysicianSession(): Promise<PhysicianSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PHYSICIAN_COOKIE_NAME)?.value;
    return verifySessionToken(token);
  } catch {
    // Gracefully return null if called outside Next.js request context (e.g. test scripts)
    return null;
  }
}


"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTHORIZED_PHYSICIANS,
  createSessionToken,
  PHYSICIAN_COOKIE_NAME,
  getActivePhysicianSession,
  PhysicianSessionPayload,
} from "@/lib/auth/physician-session";

export interface LoginResult {
  success: boolean;
  error?: string;
  physician?: PhysicianSessionPayload;
}

/**
 * Authenticates a physician and sets an HttpOnly session cookie.
 */
export async function loginPhysicianAction(
  physicianId: string,
  passcode: string
): Promise<LoginResult> {
  const trimmedId = physicianId?.trim();
  const trimmedPass = passcode?.trim();

  if (!trimmedId || !trimmedPass) {
    return { success: false, error: "Physician ID and passcode are required." };
  }

  const account = AUTHORIZED_PHYSICIANS[trimmedId];
  if (!account || account.passcode !== trimmedPass) {
    return {
      success: false,
      error: "Invalid Physician ID or passcode. Please verify your clinical credentials.",
    };
  }

  const token = createSessionToken({
    physicianId: account.physicianId,
    fullName: account.fullName,
    department: account.department,
    registrationNumber: account.registrationNumber,
    role: account.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(PHYSICIAN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60, // 8 hours in seconds
  });

  return {
    success: true,
    physician: {
      physicianId: account.physicianId,
      fullName: account.fullName,
      department: account.department,
      registrationNumber: account.registrationNumber,
      role: account.role,
      authenticatedAt: new Date().toISOString(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000,
    },
  };
}

/**
 * Logs out the active physician by clearing the session cookie.
 */
export async function logoutPhysicianAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PHYSICIAN_COOKIE_NAME);
  redirect("/doctor/login");
}

/**
 * Checks the active physician session state.
 */
export async function getPhysicianSessionAction(): Promise<{
  isAuthenticated: boolean;
  physician: PhysicianSessionPayload | null;
}> {
  const session = await getActivePhysicianSession();
  return {
    isAuthenticated: Boolean(session),
    physician: session,
  };
}

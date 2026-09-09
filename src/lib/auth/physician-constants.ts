export const PHYSICIAN_COOKIE_NAME = "medikiosk_physician_session";

export interface PhysicianProfile {
  physicianId: string;
  fullName: string;
  department: string;
  registrationNumber: string;
  role: "attending_physician" | "chief_medical_officer" | "clinical_reviewer";
}

export interface PhysicianSessionPayload extends PhysicianProfile {
  authenticatedAt: string;
  expiresAt: number; // Unix timestamp ms
}

/**
 * Pre-authorized clinical staff profiles for SIH demonstration and OPD workstation.
 */
export const AUTHORIZED_PHYSICIANS: Record<
  string,
  PhysicianProfile & { passcode: string }
> = {
  "DOC-MH-40182": {
    physicianId: "DOC-MH-40182",
    fullName: "Dr. Arvind Sharma, MD",
    department: "Internal Medicine & Acute Care",
    registrationNumber: "MCI-2012-40182-MH",
    role: "attending_physician",
    passcode: "doctor123",
  },
  "DOC-AIIMS-7721": {
    physicianId: "DOC-AIIMS-7721",
    fullName: "Dr. Priya Deshmukh, MS",
    department: "Emergency Medicine & Triage",
    registrationNumber: "MCI-2016-77210-DL",
    role: "clinical_reviewer",
    passcode: "doctor123",
  },
};

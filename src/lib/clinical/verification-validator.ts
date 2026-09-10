/**
 * MediKiosk — Physician Verification Payload Validator
 *
 * Deterministic, pure validation and sanitization for physician verification payloads.
 * Decoupled from server action boundaries so it can be imported synchronously
 * and unit-tested without Next.js "use server" action constraints.
 */

import type {
  ClinicalReconciliationSection,
  ClinicalReconciliationAction,
  ClinicalReconciliationItem,
  PhysicianReconciliationChanges,
} from "@/types/clinical";

export const VALID_RECONCILIATION_SECTIONS = new Set<ClinicalReconciliationSection>([
  "chief_complaint",
  "symptoms",
  "past_medical_history",
  "medications",
  "allergies",
  "laboratory_investigations",
  "documented_conditions",
  "triage_priority",
  "other",
]);

export const VALID_RECONCILIATION_ACTIONS = new Set<ClinicalReconciliationAction>([
  "added",
  "modified",
  "removed",
  "confirmed",
]);

export interface ValidatedVerificationData {
  sessionId: string;
  physicianNotes: string;
  editedClinicalSummary: string | null;
  reconciliationChanges: PhysicianReconciliationChanges | null;
}

export function validateVerificationPayload(payload: unknown): {
  isValid: boolean;
  error?: string;
  cleanData?: ValidatedVerificationData;
} {
  if (!payload || typeof payload !== "object") {
    return { isValid: false, error: "Invalid payload: request body must be an object." };
  }

  const p = payload as Record<string, unknown>;

  // 1. sessionId validation
  if (typeof p.sessionId !== "string" || !p.sessionId.trim()) {
    return { isValid: false, error: "Validation error: sessionId is required." };
  }
  const sessionId = p.sessionId.trim();
  if (sessionId.length > 64) {
    return { isValid: false, error: "Validation error: sessionId exceeds maximum allowed length." };
  }

  // 2. confirmSignOff validation
  if (p.confirmSignOff !== true) {
    return {
      isValid: false,
      error: "Validation error: Explicit confirmation (confirmSignOff: true) is required to sign off.",
    };
  }

  // 3. physicianNotes validation
  if (typeof p.physicianNotes !== "string" || !p.physicianNotes.trim()) {
    return {
      isValid: false,
      error: "Validation error: Clinical notes are required for physician verification.",
    };
  }
  const physicianNotes = p.physicianNotes.trim();
  if (physicianNotes.length > 10000) {
    return {
      isValid: false,
      error: "Validation error: Clinical notes exceed maximum permitted length (10,000 characters).",
    };
  }

  // 4. editedClinicalSummary validation
  let editedClinicalSummary: string | null = null;
  if (p.editedClinicalSummary !== undefined && p.editedClinicalSummary !== null) {
    if (typeof p.editedClinicalSummary !== "string") {
      return {
        isValid: false,
        error: "Validation error: editedClinicalSummary must be a string or null.",
      };
    }
    const trimmedSummary = p.editedClinicalSummary.trim();
    if (trimmedSummary.length > 20000) {
      return {
        isValid: false,
        error: "Validation error: editedClinicalSummary exceeds maximum length (20,000 characters).",
      };
    }
    editedClinicalSummary = trimmedSummary.length > 0 ? trimmedSummary : null;
  }

  // 5. reconciliationChanges validation
  let reconciliationChanges: ValidatedVerificationData["reconciliationChanges"] = null;

  if (p.reconciliationChanges !== undefined && p.reconciliationChanges !== null) {
    if (typeof p.reconciliationChanges !== "object") {
      return {
        isValid: false,
        error: "Validation error: reconciliationChanges must be a structured object or null.",
      };
    }

    const rc = p.reconciliationChanges as Record<string, unknown>;
    if (!Array.isArray(rc.entries)) {
      return {
        isValid: false,
        error: "Validation error: reconciliationChanges.entries must be an array.",
      };
    }

    if (rc.entries.length > 100) {
      return {
        isValid: false,
        error: "Validation error: Too many reconciliation entries (maximum 100 permitted).",
      };
    }

    const validatedEntries: ClinicalReconciliationItem[] = [];
    for (let i = 0; i < rc.entries.length; i++) {
      const entry = rc.entries[i];
      if (!entry || typeof entry !== "object") {
        return {
          isValid: false,
          error: `Validation error: Reconciliation entry at index ${i} is not an object.`,
        };
      }

      const e = entry as Record<string, unknown>;

      if (typeof e.section !== "string" || !VALID_RECONCILIATION_SECTIONS.has(e.section as ClinicalReconciliationSection)) {
        return {
          isValid: false,
          error: `Validation error: Entry ${i} has invalid clinical section: '${String(e.section)}'.`,
        };
      }

      if (typeof e.action !== "string" || !VALID_RECONCILIATION_ACTIONS.has(e.action as ClinicalReconciliationAction)) {
        return {
          isValid: false,
          error: `Validation error: Entry ${i} has invalid reconciliation action: '${String(e.action)}'.`,
        };
      }

      if (typeof e.itemName !== "string" || !e.itemName.trim()) {
        return {
          isValid: false,
          error: `Validation error: Entry ${i} must have a non-empty itemName.`,
        };
      }
      if (e.itemName.trim().length > 255) {
        return {
          isValid: false,
          error: `Validation error: Entry ${i} itemName exceeds 255 characters.`,
        };
      }

      const previousValue =
        typeof e.previousValue === "string" ? e.previousValue.trim() : null;
      const updatedValue =
        typeof e.updatedValue === "string" ? e.updatedValue.trim() : null;

      if (previousValue && previousValue.length > 2000) {
        return {
          isValid: false,
          error: `Validation error: Entry ${i} previousValue exceeds 2,000 characters.`,
        };
      }
      if (updatedValue && updatedValue.length > 2000) {
        return {
          isValid: false,
          error: `Validation error: Entry ${i} updatedValue exceeds 2,000 characters.`,
        };
      }

      let reason: string | undefined = undefined;
      if (e.reason !== undefined && e.reason !== null) {
        if (typeof e.reason !== "string") {
          return {
            isValid: false,
            error: `Validation error: Entry ${i} reason must be a string.`,
          };
        }
        const trimmedReason = e.reason.trim();
        if (trimmedReason.length > 1000) {
          return {
            isValid: false,
            error: `Validation error: Entry ${i} reason exceeds 1,000 characters.`,
          };
        }
        if (trimmedReason) {
          reason = trimmedReason;
        }
      }

      validatedEntries.push({
        section: e.section as ClinicalReconciliationSection,
        action: e.action as ClinicalReconciliationAction,
        itemName: e.itemName.trim(),
        previousValue,
        updatedValue,
        ...(reason ? { reason } : {}),
      });
    }

    let reconciliationNotes: string | undefined = undefined;
    if (rc.reconciliationNotes !== undefined && rc.reconciliationNotes !== null) {
      if (typeof rc.reconciliationNotes !== "string") {
        return {
          isValid: false,
          error: "Validation error: reconciliationNotes must be a string.",
        };
      }
      const trimmedRcNotes = rc.reconciliationNotes.trim();
      if (trimmedRcNotes.length > 2000) {
        return {
          isValid: false,
          error: "Validation error: reconciliationNotes exceeds 2,000 characters.",
        };
      }
      if (trimmedRcNotes) {
        reconciliationNotes = trimmedRcNotes;
      }
    }

    reconciliationChanges = {
      entries: validatedEntries,
      ...(reconciliationNotes ? { reconciliationNotes } : {}),
    };
  }

  return {
    isValid: true,
    cleanData: {
      sessionId,
      physicianNotes,
      editedClinicalSummary,
      reconciliationChanges,
    },
  };
}

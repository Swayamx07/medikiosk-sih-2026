"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  DraftIntakeState,
  SupportedLanguage,
  IntakeMode,
  PatientProfile,
  ConversationMessage,
  SYNTHETIC_DEMO_CASES,
  SessionStatus,
} from "@/types/clinical";

const STORAGE_KEY = "medikiosk_intake_draft";

const DEFAULT_PROFILE: PatientProfile = SYNTHETIC_DEMO_CASES["case-1-cardiac"];

const INITIAL_STATE: DraftIntakeState = {
  selectedLanguage: "en",
  consentGranted: false,
  consentTimestamp: null,
  patientProfile: DEFAULT_PROFILE,
  sessionId: null,
  sessionCode: null,
  mode: "general",
  messages: [],
  chiefComplaint: "",
  confirmedChiefComplaint: "",
  sessionStatus: "intake_active",
};

/**
 * Recovers persisted draft state if the encounter is still active/in-progress.
 * If the stored session was already completed or verified, discards it so the next visit starts clean.
 */
function getInitialDraftState(): DraftIntakeState {
  if (typeof window === "undefined") {
    return INITIAL_STATE;
  }
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<DraftIntakeState>;

      // Check if stored session belongs to a completed/closed encounter
      if (
        parsed.sessionStatus === "ready_for_review" ||
        parsed.sessionStatus === "in_physician_review" ||
        parsed.sessionStatus === "verified" ||
        parsed.sessionStatus === "abandoned"
      ) {
        // A completed encounter must NOT leak into a new visit
        sessionStorage.removeItem(STORAGE_KEY);
        return {
          ...INITIAL_STATE,
          selectedLanguage: parsed.selectedLanguage || "en",
          patientProfile: parsed.patientProfile
            ? { ...parsed.patientProfile, id: undefined }
            : DEFAULT_PROFILE,
        };
      }

      return {
        ...INITIAL_STATE,
        ...parsed,
        patientProfile: {
          ...INITIAL_STATE.patientProfile,
          ...(parsed.patientProfile || {}),
        },
      };
    }
  } catch {
    // In private browsing or storage-restricted modes, fallback to in-memory state
  }
  return INITIAL_STATE;
}

interface IntakeContextType extends DraftIntakeState {
  setLanguage: (lang: SupportedLanguage) => void;
  setConsent: (granted: boolean) => void;
  setPatientProfile: (profile: Partial<PatientProfile>) => void;
  selectDemoProfile: (caseId: string) => void;
  setMode: (mode: IntakeMode) => void;
  setSession: (
    sessionId: string | null,
    sessionCode: string | null,
    patientId?: string | null
  ) => void;
  setChiefComplaint: (complaint: string) => void;
  setConfirmedChiefComplaint: (complaint: string) => void;
  setSessionStatus: (status: SessionStatus) => void;
  addMessage: (
    message: Omit<ConversationMessage, "id" | "timestamp">
  ) => void;
  clearMessages: () => void;
  resetIntake: () => void;
  startNewEncounter: (options?: { keepPatientProfile?: boolean }) => void;
}

const IntakeContext = createContext<IntakeContextType | undefined>(undefined);

export function IntakeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DraftIntakeState>(getInitialDraftState);

  // Sync state to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Silently handle quota errors or unavailable storage
    }
  }, [state]);

  const setLanguage = useCallback((selectedLanguage: SupportedLanguage) => {
    setState((prev) => ({
      ...prev,
      selectedLanguage,
      patientProfile: {
        ...prev.patientProfile,
        primaryLanguage: selectedLanguage,
      },
    }));
  }, []);

  const setConsent = useCallback((consentGranted: boolean) => {
    setState((prev) => ({
      ...prev,
      consentGranted,
      consentTimestamp: consentGranted ? new Date().toISOString() : null,
    }));
  }, []);

  const setPatientProfile = useCallback(
    (updates: Partial<PatientProfile>) => {
      setState((prev) => ({
        ...prev,
        patientProfile: {
          ...prev.patientProfile,
          ...updates,
        },
      }));
    },
    []
  );

  const selectDemoProfile = useCallback((caseId: string) => {
    const demo = SYNTHETIC_DEMO_CASES[caseId];
    if (demo) {
      setState((prev) => ({
        ...prev,
        patientProfile: {
          ...demo,
          primaryLanguage: prev.selectedLanguage, // Preserve selected language
        },
      }));
    }
  }, []);

  const setMode = useCallback((mode: IntakeMode) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const setSession = useCallback(
    (
      sessionId: string | null,
      sessionCode: string | null,
      patientId?: string | null
    ) => {
      setState((prev) => ({
        ...prev,
        sessionId,
        sessionCode,
        patientProfile: patientId
          ? { ...prev.patientProfile, id: patientId }
          : prev.patientProfile,
      }));
    },
    []
  );

  const setChiefComplaint = useCallback((chiefComplaint: string) => {
    setState((prev) => ({ ...prev, chiefComplaint }));
  }, []);

  const setConfirmedChiefComplaint = useCallback(
    (confirmedChiefComplaint: string) => {
      setState((prev) => ({ ...prev, confirmedChiefComplaint }));
    },
    []
  );

  const setSessionStatus = useCallback((sessionStatus: SessionStatus) => {
    setState((prev) => ({ ...prev, sessionStatus }));
  }, []);

  const addMessage = useCallback(
    (msg: Omit<ConversationMessage, "id" | "timestamp">) => {
      const newMessage: ConversationMessage = {
        ...msg,
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, newMessage],
      }));
    },
    []
  );

  const clearMessages = useCallback(() => {
    setState((prev) => ({ ...prev, messages: [] }));
  }, []);

  /**
   * Resets intake completely.
   */
  const resetIntake = useCallback(() => {
    setState(INITIAL_STATE);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  /**
   * Starts a brand new clinical encounter.
   * If keepPatientProfile is true, retains demographic identity while resetting encounter data.
   */
  const startNewEncounter = useCallback(
    (options?: { keepPatientProfile?: boolean }) => {
      setState((prev) => ({
        ...INITIAL_STATE,
        selectedLanguage: prev.selectedLanguage,
        patientProfile: options?.keepPatientProfile
          ? { ...prev.patientProfile, id: undefined }
          : DEFAULT_PROFILE,
        consentGranted: false,
        consentTimestamp: null,
        sessionId: null,
        sessionCode: null,
        messages: [],
        chiefComplaint: "",
        confirmedChiefComplaint: "",
        sessionStatus: "intake_active",
      }));
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    },
    []
  );

  return (
    <IntakeContext.Provider
      value={{
        ...state,
        setLanguage,
        setConsent,
        setPatientProfile,
        selectDemoProfile,
        setMode,
        setSession,
        setChiefComplaint,
        setConfirmedChiefComplaint,
        setSessionStatus,
        addMessage,
        clearMessages,
        resetIntake,
        startNewEncounter,
      }}
    >
      {children}
    </IntakeContext.Provider>
  );
}

export function useIntake() {
  const context = useContext(IntakeContext);
  if (!context) {
    throw new Error("useIntake must be used within an IntakeProvider");
  }
  return context;
}

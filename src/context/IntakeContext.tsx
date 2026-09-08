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
  sessionStatus: "intake_active",
};

function getInitialDraftState(): DraftIntakeState {
  if (typeof window === "undefined") {
    return INITIAL_STATE;
  }
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<DraftIntakeState>;
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
  setSession: (sessionId: string | null, sessionCode: string | null) => void;
  setChiefComplaint: (complaint: string) => void;
  setSessionStatus: (status: SessionStatus) => void;
  addMessage: (
    message: Omit<ConversationMessage, "id" | "timestamp">
  ) => void;
  clearMessages: () => void;
  resetIntake: () => void;
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
        patientProfile: { ...demo },
      }));
    }
  }, []);

  const setMode = useCallback((mode: IntakeMode) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  const setSession = useCallback(
    (sessionId: string | null, sessionCode: string | null) => {
      setState((prev) => ({ ...prev, sessionId, sessionCode }));
    },
    []
  );

  const setChiefComplaint = useCallback((chiefComplaint: string) => {
    setState((prev) => ({ ...prev, chiefComplaint }));
  }, []);

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

  const resetIntake = useCallback(() => {
    setState(INITIAL_STATE);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

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
        setSessionStatus,
        addMessage,
        clearMessages,
        resetIntake,
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

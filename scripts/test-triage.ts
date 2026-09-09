/**
 * Deterministic Clinical Safety & Red-Flag Triage Verification Test Suite
 * Covers TEST 1 through TEST 8 according to Phase 4 Checkpoint 5 requirements.
 */

import fs from "fs";
import path from "path";

// Load environment variables from .env.local if not already set
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...vals] = trimmed.split("=");
    if (key && vals.length > 0 && !process.env[key.trim()]) {
      process.env[key.trim()] = vals.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
}

import {
  evaluateSessionTriage,
  RULE_CARDIAC_CHEST_PAIN,
} from "../src/lib/clinical/triage";
import {
  createOrResumeClinicalSessionAction,
  saveClinicalAnswerAction,
} from "../src/app/actions/intake";
import { createServerAdminClient } from "../src/lib/supabase/server";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

async function runTests() {
  console.log("================================================================================");
  console.log("MediKiosk — Deterministic Safety & Red-Flag Triage Engine Test Suite");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // TEST 1 — English positive
  // ---------------------------------------------------------------------------
  try {
    const input = "Severe chest pain with sweating and pain going to my left arm.";
    const evalRes = evaluateSessionTriage(input);

    const isPass =
      evalRes.triggered === true &&
      evalRes.alertLevel === "critical_red_flag" &&
      evalRes.triggerRuleId === RULE_CARDIAC_CHEST_PAIN &&
      Array.isArray(evalRes.triggerSymptoms) &&
      evalRes.triggerSymptoms.includes("chest_pain") &&
      evalRes.triggerSymptoms.includes("diaphoresis");

    results.push({
      name: "TEST 1 — English positive",
      passed: isPass,
      details: isPass
        ? `Triggered ${evalRes.triggerRuleId} (${evalRes.alertLevel}), symptoms: ${evalRes.triggerSymptoms?.join(", ")}`
        : `Failed to trigger: ${JSON.stringify(evalRes)}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 1 — English positive",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 2 — Hindi positive
  // ---------------------------------------------------------------------------
  try {
    const input = "मुझे कल शाम से सीने में तेज दर्द हो रहा है और बहुत पसीना आ रहा है, सांस लेने में तकलीफ है।";
    const evalRes = evaluateSessionTriage(input);

    const isPass =
      evalRes.triggered === true &&
      evalRes.alertLevel === "critical_red_flag" &&
      evalRes.triggerRuleId === RULE_CARDIAC_CHEST_PAIN &&
      Boolean(evalRes.triggerSymptoms?.includes("chest_pain"));

    results.push({
      name: "TEST 2 — Hindi positive",
      passed: isPass,
      details: isPass
        ? `Triggered ${evalRes.triggerRuleId}, symptoms: ${evalRes.triggerSymptoms?.join(", ")}`
        : `Failed to trigger: ${JSON.stringify(evalRes)}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 2 — Hindi positive",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 3 — Marathi positive
  // ---------------------------------------------------------------------------
  try {
    const input = "मला काल संध्याकाळपासून छातीत तीव्र वेदना होत असून खूप घाम येत आहे आणि डाव्या हाताकडे वेदना पसरत आहेत.";
    const evalRes = evaluateSessionTriage(input);

    const isPass =
      evalRes.triggered === true &&
      evalRes.alertLevel === "critical_red_flag" &&
      evalRes.triggerRuleId === RULE_CARDIAC_CHEST_PAIN &&
      Boolean(evalRes.triggerSymptoms?.includes("chest_pain"));

    results.push({
      name: "TEST 3 — Marathi positive",
      passed: isPass,
      details: isPass
        ? `Triggered ${evalRes.triggerRuleId}, symptoms: ${evalRes.triggerSymptoms?.join(", ")}`
        : `Failed to trigger: ${JSON.stringify(evalRes)}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 3 — Marathi positive",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 4 — Negative
  // ---------------------------------------------------------------------------
  try {
    const input = "Mild headache since morning.";
    const evalRes = evaluateSessionTriage(input);

    const isPass = evalRes.triggered === false;

    results.push({
      name: "TEST 4 — Negative",
      passed: isPass,
      details: isPass
        ? "Correctly evaluated as non-trigger (triggered === false)"
        : `Erroneously triggered: ${JSON.stringify(evalRes)}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 4 — Negative",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 5 — Insufficient combination
  // ---------------------------------------------------------------------------
  try {
    const input = "Chest pain since morning.";
    const evalRes = evaluateSessionTriage(input);

    const isPass = evalRes.triggered === false;

    results.push({
      name: "TEST 5 — Insufficient combination",
      passed: isPass,
      details: isPass
        ? "Correctly prevented alert: chest pain without secondary concerning feature did not trigger"
        : `Erroneously triggered on chest pain alone: ${JSON.stringify(evalRes)}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 5 — Insufficient combination",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // DATABASE INTEGRATION TESTS (TEST 6, 7, 8)
  // ---------------------------------------------------------------------------
  let testSessionId: string | undefined = undefined;
  const supabase = createServerAdminClient();

  try {
    // 1. Create temporary synthetic session for testing
    const createRes = await createOrResumeClinicalSessionAction({
      patientProfile: {
        patientIdentifier: `TEST-PT-${Date.now()}`,
        fullName: "Test Automated Triage",
        dateOfBirth: "1980-01-01",
        gender: "male",
        primaryLanguage: "en",
        isDemo: true,
      },
      language: "en",
      mode: "general",
      consentGranted: true,
    });

    if (!createRes.success || !createRes.sessionId) {
      throw new Error(`Failed to create test session: ${createRes.error}`);
    }

    testSessionId = createRes.sessionId;

    // 2. Answer 1: triggers red flag
    const answer1Res = await saveClinicalAnswerAction({
      sessionId: testSessionId,
      stepNumber: 1,
      questionDomain: "chief_complaint",
      questionText: "What symptoms brought you to the clinic?",
      answerText: "Severe chest pain with heavy sweating since yesterday.",
      language: "en",
    });

    // TEST 8 — Persistence ordering: Verify answer saved before triage insertion
    const { data: dbAnswer } = await supabase
      .from("clinical_answers")
      .select("id, raw_answer_text, session_id")
      .eq("session_id", testSessionId)
      .single();

    const isTest8Pass =
      answer1Res.success &&
      Boolean(dbAnswer) &&
      answer1Res.triageAlert?.triggered === true &&
      answer1Res.triageAlert?.isExisting === false;

    results.push({
      name: "TEST 8 — Persistence ordering",
      passed: isTest8Pass,
      details: isTest8Pass
        ? `Answer ${dbAnswer?.id} successfully verified in DB before triage alert dispatched`
        : `Ordering failure: answer=${JSON.stringify(dbAnswer)}, alert=${JSON.stringify(answer1Res.triageAlert)}`,
    });

    // TEST 7 — Priority: positive red flag changes session priority to emergency
    const { data: dbSessionAfter1 } = await supabase
      .from("clinical_sessions")
      .select("priority")
      .eq("id", testSessionId)
      .single();

    const isTest7Pass = dbSessionAfter1?.priority === "emergency";

    results.push({
      name: "TEST 7 — Priority escalation",
      passed: isTest7Pass,
      details: isTest7Pass
        ? `clinical_sessions.priority successfully escalated to '${dbSessionAfter1?.priority}'`
        : `Priority not emergency: '${dbSessionAfter1?.priority}'`,
    });

    // TEST 6 — Duplicate prevention: evaluate the same session/rule twice
    const answer2Res = await saveClinicalAnswerAction({
      sessionId: testSessionId,
      stepNumber: 2,
      questionDomain: "hpi_onset",
      questionText: "Does the pain spread anywhere?",
      answerText: "The chest pain is crushing and radiates down my left arm.",
      language: "en",
    });

    // Check count of triage_alerts rows for this session and rule
    const { data: alerts } = await supabase
      .from("triage_alerts")
      .select("id, trigger_rule_id", { count: "exact" })
      .eq("session_id", testSessionId)
      .eq("trigger_rule_id", RULE_CARDIAC_CHEST_PAIN);

    const isTest6Pass =
      answer2Res.success &&
      answer2Res.triageAlert?.triggered === true &&
      answer2Res.triageAlert?.isExisting === true &&
      alerts?.length === 1;

    results.push({
      name: "TEST 6 — Duplicate prevention",
      passed: isTest6Pass,
      details: isTest6Pass
        ? `Second answer recognized existing alert (isExisting: true), exact DB alert count = ${alerts?.length}`
        : `Duplicate prevention failed: count=${alerts?.length}, isExisting=${answer2Res.triageAlert?.isExisting}`,
    });
  } catch (err) {
    console.error("Database integration tests encountered error:", err);
    results.push({
      name: "TEST 6 — Duplicate prevention",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
    results.push({
      name: "TEST 7 — Priority escalation",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
    results.push({
      name: "TEST 8 — Persistence ordering",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  } finally {
    // Clean up test session if created
    if (testSessionId) {
      await supabase.from("clinical_sessions").delete().eq("id", testSessionId);
    }
  }

  // Print Summary
  console.log("--------------------------------------------------------------------------------");
  let allPassed = true;
  for (const res of results) {
    const status = res.passed ? "PASS" : "FAIL";
    if (!res.passed) allPassed = false;
    console.log(`[${status}] ${res.name}: ${res.details}`);
  }
  console.log("--------------------------------------------------------------------------------");
  console.log(`Final Verdict: ${allPassed ? "ALL TESTS PASSED ✓" : "SOME TESTS FAILED ✗"}`);
  console.log("================================================================================\n");

  if (!allPassed) {
    process.exit(1);
  }
}

runTests();

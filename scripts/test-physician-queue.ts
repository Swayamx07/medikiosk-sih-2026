/**
 * Read-Only Verification Test Suite for Live Supabase Physician Queue
 * Verifies live queue fetching, priority sorting, triage alert visibility,
 * and complete case-detail Q&A retrieval across all 3 synthetic cases.
 */

import fs from "fs";
import path from "path";

// Load environment variables from .env.local
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
  getPhysicianQueueAction,
  getPhysicianCaseDetailAction,
} from "../src/app/actions/doctor";

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

async function runQueueTests() {
  console.log("================================================================================");
  console.log("MediKiosk — Live Supabase Physician Queue & Case Review Verification");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // TEST 1 — Live Queue Fetching from Supabase
  // ---------------------------------------------------------------------------
  const queueResult = await getPhysicianQueueAction();
  try {
    const isPass =
      queueResult.success === true &&
      Array.isArray(queueResult.queue) &&
      queueResult.queue.length >= 3;

    results.push({
      name: "TEST 1 — Live Supabase queue fetching",
      passed: isPass,
      details: isPass
        ? `Successfully fetched ${queueResult.queue.length} live encounters from clinical_sessions`
        : `Queue query failed: ${queueResult.error || "Fewer than 3 sessions returned"}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 1 — Live Supabase queue fetching",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 2 — Priority Sorting (Emergency Cases First)
  // ---------------------------------------------------------------------------
  try {
    const firstItem = queueResult.queue[0];
    const isPass =
      Boolean(firstItem) &&
      (firstItem.priority === "emergency" || firstItem.hasCriticalRedFlag);

    results.push({
      name: "TEST 2 — Priority queue sorting",
      passed: isPass,
      details: isPass
        ? `First queue item is priority '${firstItem.priority}' (${firstItem.sessionCode} - ${firstItem.patientName})`
        : `First item is not emergency: priority='${firstItem?.priority}'`,
    });
  } catch (err) {
    results.push({
      name: "TEST 2 — Priority queue sorting",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 3 — Triage Alert Visibility on Queue
  // ---------------------------------------------------------------------------
  try {
    const case1Item = queueResult.queue.find(
      (i) => i.sessionCode === "CS-2026-0908-01" || i.priority === "emergency"
    );

    const isPass =
      Boolean(case1Item) &&
      case1Item?.hasCriticalRedFlag === true &&
      case1Item?.triageAlertCount > 0;

    results.push({
      name: "TEST 3 — Triage alert visibility in queue",
      passed: isPass,
      details: isPass
        ? `Case 1 (${case1Item?.sessionCode}) flagged hasCriticalRedFlag=true with ${case1Item?.triageAlertCount} alert(s)`
        : `Case 1 missing red flag: ${JSON.stringify(case1Item)}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 3 — Triage alert visibility in queue",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 4 — Case Detail: Case 1 Acute Red Flag (CS-2026-0908-01)
  // ---------------------------------------------------------------------------
  try {
    const detail1 = await getPhysicianCaseDetailAction("CS-2026-0908-01");
    const c = detail1.caseDetail;

    const isPass =
      detail1.success === true &&
      Boolean(c) &&
      c?.patient.fullName === "Ramesh Patil" &&
      c?.priority === "emergency" &&
      c?.hasCriticalRedFlag === true &&
      c?.triageAlerts.length > 0 &&
      c?.history.length >= 2;

    results.push({
      name: "TEST 4 — Case 1 detail retrieval & red flag",
      passed: isPass,
      details: isPass
        ? `Retrieved Case 1: Patient='${c?.patient.fullName}', Alerts=${c?.triageAlerts.length}, Q&A count=${c?.history.length}`
        : `Case 1 retrieval failed: ${detail1.error || JSON.stringify(c)}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 4 — Case 1 detail retrieval & red flag",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 5 — Case Detail: Case 2 Chronic Follow-up (CS-2026-0908-02)
  // ---------------------------------------------------------------------------
  try {
    const detail2 = await getPhysicianCaseDetailAction("CS-2026-0908-02");
    const c = detail2.caseDetail;

    const isPass =
      detail2.success === true &&
      Boolean(c) &&
      c?.patient.fullName === "Sunita Sharma" &&
      c?.priority === "normal" &&
      c?.history.length >= 2;

    results.push({
      name: "TEST 5 — Case 2 chronic care retrieval",
      passed: isPass,
      details: isPass
        ? `Retrieved Case 2: Patient='${c?.patient.fullName}', Status='${c?.status}', Q&A count=${c?.history.length}`
        : `Case 2 retrieval failed: ${detail2.error || JSON.stringify(c)}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 5 — Case 2 chronic care retrieval",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 6 — Case Detail: Case 3 Verified Encounter (CS-2026-0908-03)
  // ---------------------------------------------------------------------------
  try {
    const detail3 = await getPhysicianCaseDetailAction("CS-2026-0908-03");
    const c = detail3.caseDetail;

    const isPass =
      detail3.success === true &&
      Boolean(c) &&
      c?.patient.fullName === "Amit Joshi" &&
      c?.status === "verified" &&
      c?.history.length >= 1;

    results.push({
      name: "TEST 6 — Case 3 verified encounter retrieval",
      passed: isPass,
      details: isPass
        ? `Retrieved Case 3: Patient='${c?.patient.fullName}', Status='${c?.status}', ReviewVerified=${c?.physicianReview?.isVerified}`
        : `Case 3 retrieval failed: ${detail3.error || JSON.stringify(c)}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 6 — Case 3 verified encounter retrieval",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 7 — UUID Lookup Support
  // ---------------------------------------------------------------------------
  try {
    const sessionUuid = queueResult.queue[0]?.sessionId;
    const detailUuid = await getPhysicianCaseDetailAction(sessionUuid);

    const isPass =
      detailUuid.success === true &&
      detailUuid.caseDetail?.sessionId === sessionUuid;

    results.push({
      name: "TEST 7 — Lookup by UUID session ID",
      passed: isPass,
      details: isPass
        ? `Successfully resolved encounter via UUID: ${sessionUuid}`
        : `UUID resolution failed: ${detailUuid.error}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 7 — Lookup by UUID session ID",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  // ---------------------------------------------------------------------------
  // TEST 8 — Complete Q&A Structure & Metadata Inspection
  // ---------------------------------------------------------------------------
  try {
    const detail = await getPhysicianCaseDetailAction("CS-2026-0908-01");
    const firstQa = detail.caseDetail?.history[0];

    const isPass =
      Boolean(firstQa) &&
      Boolean(firstQa?.questionText) &&
      Boolean(firstQa?.answerText) &&
      Boolean(firstQa?.questionDomain) &&
      Boolean(firstQa?.inputModality);

    results.push({
      name: "TEST 8 — Chronological Q&A and modality metadata",
      passed: isPass,
      details: isPass
        ? `Q&A step ${firstQa?.stepNumber} [${firstQa?.questionDomain}]: modality='${firstQa?.inputModality}', lang='${firstQa?.languageDetected}'`
        : `Q&A structure missing metadata: ${JSON.stringify(firstQa)}`,
    });
  } catch (err) {
    results.push({
      name: "TEST 8 — Chronological Q&A and modality metadata",
      passed: false,
      details: `Exception: ${err instanceof Error ? err.message : String(err)}`,
    });
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

runQueueTests();

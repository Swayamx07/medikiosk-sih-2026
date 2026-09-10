/**
 * Focused Deterministic Test Suite for PhysicianTriageCard Display Resolution
 *
 * Verifies that PhysicianTriageCard:
 * 1. Correctly maps all 3 priority states (emergency, urgent, normal) without state overlap.
 * 2. Properly handles critical red-flag overrides.
 * 3. Never fabricates rule IDs or symptoms when absent from authoritative data.
 * 4. Preserves non-diagnostic safety advisories across all states.
 * 5. Accurately preserves evaluator provenance (deterministic_safety_engine).
 */

import {
  resolveTriageDisplayData,
  PhysicianTriageCardProps,
} from "../src/components/doctor/PhysicianTriageCard";

interface TestStats {
  passed: number;
  failed: number;
}

const stats: TestStats = { passed: 0, failed: 0 };

function assert(condition: boolean, title: string, details?: string) {
  if (condition) {
    console.log(`  [PASS] ${title}${details ? ` (${details})` : ""}`);
    stats.passed++;
  } else {
    console.error(`  [FAIL] ${title}${details ? ` (${details})` : ""}`);
    stats.failed++;
  }
}

async function runTestSuite() {
  console.log("================================================================================");
  console.log("PHASE 8.3 — PHYSICIAN TRIAGE CARD DISPLAY RESOLUTION VERIFICATION");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // 1. Emergency Priority with Full Canonical Triage
  // ---------------------------------------------------------------------------
  console.log("--- TEST 1: Emergency State with Authoritative Canonical Data ---");
  const emergencyProps: PhysicianTriageCardProps = {
    priority: "emergency",
    hasCriticalRedFlag: true,
    canonicalTriage: {
      priority: "emergency",
      criticalRedFlag: true,
      ruleId: "RULE_CARDIAC_CHEST_PAIN",
      reason: "Patient reports chest pain with diaphoresis.",
      detectedSymptoms: ["chest_pain", "diaphoresis"],
      evaluatedBy: "deterministic_safety_engine",
    },
  };

  const emRes = resolveTriageDisplayData(emergencyProps);
  assert(emRes.variant === "emergency", "Variant is emergency");
  assert(emRes.title.includes("Critical Red Flag"), "Title contains Critical Red Flag");
  assert(emRes.badgeLabel === "Emergency Priority", "Badge label is Emergency Priority");
  assert(emRes.ruleId === "RULE_CARDIAC_CHEST_PAIN", "Rule ID preserved from authoritative data");
  assert(emRes.detectedSymptoms.length === 2, "2 detected symptoms preserved");
  assert(emRes.detectedSymptoms.includes("chest_pain"), "Includes chest_pain symptom");
  assert(emRes.detectedSymptoms.includes("diaphoresis"), "Includes diaphoresis symptom");
  assert(emRes.evaluatedBy === "deterministic_safety_engine", "Evaluator provenance is deterministic_safety_engine");
  assert(emRes.safetyAdvisory.includes("Not a diagnosis"), "Safety advisory explicitly disclaims diagnosis");

  // ---------------------------------------------------------------------------
  // 2. Urgent Priority
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 2: Urgent Priority State ---");
  const urgentProps: PhysicianTriageCardProps = {
    priority: "urgent",
    hasCriticalRedFlag: false,
    canonicalTriage: {
      priority: "urgent",
      criticalRedFlag: false,
      reason: "Elevated glycemic index and chronic uncontrolled hypertension.",
      detectedSymptoms: ["hyperglycemia"],
      evaluatedBy: "deterministic_safety_engine",
    },
  };

  const urgRes = resolveTriageDisplayData(urgentProps);
  assert(urgRes.variant === "urgent", "Variant is urgent");
  assert(urgRes.title.includes("Urgent Priority"), "Title contains Urgent Priority");
  assert(urgRes.badgeLabel === "Urgent Priority", "Badge label is Urgent Priority");
  assert(urgRes.reason === "Elevated glycemic index and chronic uncontrolled hypertension.", "Authoritative reason preserved");
  assert(urgRes.safetyAdvisory.includes("Not a diagnosis"), "Urgent safety advisory disclaims diagnosis");

  // ---------------------------------------------------------------------------
  // 3. Standard / Normal Priority
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 3: Standard (Normal) Priority State ---");
  const normalProps: PhysicianTriageCardProps = {
    priority: "normal",
    hasCriticalRedFlag: false,
    canonicalTriage: {
      priority: "normal",
      criticalRedFlag: false,
      detectedSymptoms: [],
      evaluatedBy: "deterministic_safety_engine",
    },
  };

  const normRes = resolveTriageDisplayData(normalProps);
  assert(normRes.variant === "normal", "Variant is normal");
  assert(normRes.title.includes("Standard Priority"), "Title contains Standard Priority");
  assert(normRes.badgeLabel === "Standard", "Badge label is Standard");
  assert(normRes.ruleId === undefined, "Normal priority emits no ruleId");
  assert(normRes.detectedSymptoms.length === 0, "Normal priority has 0 trigger symptoms");
  assert(normRes.safetyAdvisory.includes("does not rule out underlying clinical pathology"), "Safety advisory clarifies screening limits");

  // ---------------------------------------------------------------------------
  // 4. Safety Override: hasCriticalRedFlag overrides priority: "normal"
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 4: Safety Escalation Override ---");
  const overrideProps: PhysicianTriageCardProps = {
    priority: "normal",
    hasCriticalRedFlag: true,
  };

  const overRes = resolveTriageDisplayData(overrideProps);
  assert(overRes.variant === "emergency", "hasCriticalRedFlag: true escalates normal to emergency");
  assert(overRes.badgeLabel === "Emergency Priority", "Escalated variant receives Emergency Priority badge");

  // ---------------------------------------------------------------------------
  // 5. Zero-Fabrication Invariant (No ruleId when none present)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 5: Zero-Fabrication Invariant ---");
  const unconfiguredEmergency: PhysicianTriageCardProps = {
    priority: "emergency",
    hasCriticalRedFlag: false,
    triageAlerts: [],
    canonicalTriage: null,
  };

  const unconfRes = resolveTriageDisplayData(unconfiguredEmergency);
  assert(unconfRes.ruleId === undefined, "Does NOT fabricate RULE_CARDIAC_CHEST_PAIN when ruleId absent from data");
  assert(unconfRes.detectedSymptoms.length === 0, "Does NOT fabricate symptoms when absent from data");

  console.log("\n================================================================================");
  console.log(`TEST SUMMARY: ${stats.passed}/${stats.passed + stats.failed} tests passed (${Math.round((stats.passed / (stats.passed + stats.failed)) * 100)}%)`);
  console.log("================================================================================\n");

  if (stats.failed > 0) {
    process.exit(1);
  }
}

runTestSuite();

/**
 * Verification Test Suite for Chief Complaint Quality & Classification
 */

import { classifyAndValidateChiefComplaint } from "../src/lib/clinical/cleaner";

async function runChiefComplaintTests() {
  console.log("================================================================================");
  console.log("MediKiosk — Chief Complaint Quality & Validation Test Suite");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  async function testCase(
    input: string,
    lang: "en" | "hi" | "mr",
    expectedValid: boolean,
    expectedCategory: string,
    description: string
  ) {
    const res = await classifyAndValidateChiefComplaint(input, lang);
    const validMatches = res.isValidComplaint === expectedValid;
    const catMatches = res.category === expectedCategory;

    if (validMatches && catMatches) {
      console.log(`[PASS] ${description} -> category: "${res.category}", isValid: ${res.isValidComplaint}`);
      passed++;
    } else {
      console.error(
        `[FAIL] ${description}\n  Expected: valid=${expectedValid}, category=${expectedCategory}\n  Received: valid=${res.isValidComplaint}, category=${res.category}`
      );
      failed++;
    }
  }

  // 1. English Meaningful Clinical Statements
  await testCase(
    "Severe chest pain since yesterday evening with sweating",
    "en",
    true,
    "meaningful",
    "English Acute Cardiac Symptom"
  );
  await testCase(
    "High fever and dry cough for the past 3 days",
    "en",
    true,
    "meaningful",
    "English Respiratory Symptom"
  );
  await testCase(
    "Hello doctor, my knee hurts badly when walking upstairs",
    "en",
    true,
    "meaningful",
    "English Joint Pain with Greeting Prefix"
  );

  // 2. Hindi Meaningful Clinical Statements
  await testCase(
    "मुझे कल शाम से सीने में तेज दर्द और पसीना आ रहा है",
    "hi",
    true,
    "meaningful",
    "Hindi Acute Chest Pain"
  );
  await testCase(
    "डॉक्टर साहब, 3 दिन से तेज बुखार और सिरदर्द है",
    "hi",
    true,
    "meaningful",
    "Hindi Fever & Headache with Greeting"
  );
  await testCase(
    "pet me bohot tez dard ho raha hai",
    "hi",
    true,
    "meaningful",
    "Hinglish Abdominal Pain"
  );

  // 3. Marathi Meaningful Clinical Statements
  await testCase(
    "मला काल संध्याकाळपासून छातीत तीव्र वेदना आणि श्वास घेण्यास त्रास होत आहे",
    "mr",
    true,
    "meaningful",
    "Marathi Acute Chest Pain & Dyspnea"
  );
  await testCase(
    "नमस्कार डॉक्टर, दोन दिवसांपासून खूप ताप आला आहे",
    "mr",
    true,
    "meaningful",
    "Marathi Fever with Greeting"
  );
  await testCase(
    "doke khup dukhate aani chakkar yet ahe",
    "mr",
    true,
    "meaningful",
    "Marathlish Headache & Dizziness"
  );

  // 4. Obvious Non-Clinical Gibberish
  await testCase(
    "asdfghjkl",
    "en",
    false,
    "non_clinical_gibberish",
    "Keyboard Smash Consonant String"
  );
  await testCase(
    "123456789",
    "en",
    false,
    "non_clinical_gibberish",
    "Pure Digits String"
  );
  await testCase(
    "zzzzzzzz",
    "en",
    false,
    "non_clinical_gibberish",
    "Repeating Characters"
  );

  // 5. Insufficient / Unclear Input
  await testCase(
    "hi",
    "en",
    false,
    "unclear_insufficient",
    "Short Greeting (Too Short)"
  );
  await testCase(
    "ok",
    "hi",
    false,
    "unclear_insufficient",
    "Single Acknowledgment Word"
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runChiefComplaintTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

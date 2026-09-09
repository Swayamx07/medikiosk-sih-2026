/**
 * Verification Test Suite for Physician Dashboard Access Control & Auth
 */

import {
  createSessionToken,
  verifySessionToken,
  AUTHORIZED_PHYSICIANS,
} from "../src/lib/auth/physician-session";

async function runAuthTests() {
  console.log("================================================================================");
  console.log("MediKiosk — Physician Access Control & Auth Verification Suite");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details: string = "") {
    if (condition) {
      console.log(`[PASS] ${title} ${details ? `(${details})` : ""}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title} ${details ? `(${details})` : ""}`);
      failed++;
    }
  }

  // 1. Authorized Physician Credentials
  const doc = AUTHORIZED_PHYSICIANS["DOC-MH-40182"];
  assert(
    Boolean(doc && doc.fullName === "Dr. Arvind Sharma, MD"),
    "Authorized Physician Profile Exists",
    `Found: ${doc?.fullName}`
  );

  // 2. Token Creation & Verification
  const token = createSessionToken({
    physicianId: doc.physicianId,
    fullName: doc.fullName,
    department: doc.department,
    registrationNumber: doc.registrationNumber,
    role: doc.role,
  });

  assert(
    Boolean(token && token.includes(".")),
    "Session Token Created with Signature",
    `Token length: ${token.length}`
  );

  const verified = verifySessionToken(token);
  assert(
    verified !== null && verified.physicianId === "DOC-MH-40182",
    "Session Token Cryptographically Verified",
    `Verified ID: ${verified?.physicianId}`
  );

  // 3. Tampered Token Rejection
  const [payload, sig] = token.split(".");
  const tamperedToken = `${payload}.invalidsignature123`;
  const tamperedResult = verifySessionToken(tamperedToken);
  assert(
    tamperedResult === null,
    "Tampered Token Rejected by HMAC Check",
    "Invalid signature correctly produced null"
  );

  // 4. Corrupt Payload Rejection
  const corruptToken = `invalidbase64.${sig}`;
  const corruptResult = verifySessionToken(corruptToken);
  assert(
    corruptResult === null,
    "Corrupt Payload Rejected Gracefully",
    "Malformed payload safely produced null"
  );

  // 5. Empty / Null Token Handling
  assert(
    verifySessionToken("") === null && verifySessionToken(null) === null,
    "Empty and Null Tokens Safely Rejected"
  );

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

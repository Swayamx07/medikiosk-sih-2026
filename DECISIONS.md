# MediKiosk — ARCHITECTURAL DECISIONS

This document records decisions that should not be reconsidered casually.

---

# D001 — PRODUCT NAME

Decision:

Product name is MediKiosk.

Status:

LOCKED

---

# D002 — FRAMEWORK

Decision:

Use Next.js with App Router and TypeScript.

Reason:

Single application architecture with frontend and server-side capabilities.

Status:

LOCKED

---

# D003 — DATABASE

Decision:

Use Supabase PostgreSQL.

Reason:

Fast development, relational data, authentication/storage capabilities and simple deployment.

Status:

LOCKED

---

# D004 — AI

Decision:

Use Gemini as the primary AI provider.

Reason:

Multimodal capabilities and suitable for document processing and structured clinical extraction.

Status:

LOCKED

---

# D005 — AI FALLBACK

Decision:

Implement MockAIProvider.

Reason:

The SIH demo must remain functional if Gemini fails or quota is unavailable.

Status:

LOCKED

---

# D006 — RED FLAG ENGINE

Decision:

Red-flag escalation uses deterministic rules after structured symptom extraction.

Reason:

Safety and predictability.

Status:

LOCKED

---

# D007 — FHIR

Decision:

Generate FHIR-compatible data from structured internal clinical records.

Do not rely on an LLM to freely generate the complete FHIR Bundle.

Status:

LOCKED

---

# D008 — ABDM

Decision:

Use an adapter abstraction and demonstrate mock/sandbox integration.

Do not claim production integration without actual implementation.

Status:

LOCKED

---

# D009 — DATA

Decision:

Use synthetic patient data only.

Status:

LOCKED

---

# D010 — BACKEND

Decision:

Do not create a separate Express backend.

Use Next.js server-side capabilities.

Status:

LOCKED

---

# D011 — RAG

Decision:

Do not implement RAG for the MVP.

Reason:

It does not directly contribute enough to the core SIH workflow to justify the complexity under the time constraint.

Status:

LOCKED

---

# D012 — VECTOR DATABASE

Decision:

Do not implement vector search/vector database for MVP.

Status:

LOCKED

---

# D013 — MICROSERVICES

Decision:

Do not use microservices.

Reason:

Adds deployment and debugging complexity without improving the core demonstration.

Status:

LOCKED

---

# D014 — REAL-TIME WEBSOCKETS

Decision:

Do not implement real-time infrastructure unless a concrete demo requirement emerges.

Status:

LOCKED

---

# D015 — MOBILE APP

Decision:

Do not create a separate mobile application.

Responsive web interface is sufficient for the prototype.

Status:

LOCKED

---

# D016 — FEATURE PRIORITY

Decision:

P0 functionality always takes priority over visual polish and optional features.

Status:

LOCKED

---

# D017 — ARCHITECTURE CHANGES

No AI agent may change a locked architectural decision without explicit approval from the project owner.

Status:

LOCKED
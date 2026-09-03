# MediKiosk — AI AGENT RULES

These rules apply to every AI coding agent.

---

# RULE 1 — LOAD CONTEXT FIRST

Before modifying code, read:

AI_CONTEXT.md
PROJECT_STATE.md
ROADMAP.md
REQUIREMENTS.md
ARCHITECTURE.md

If the task involves the final demonstration, also read:

DEMO_SCRIPT.md

---

# RULE 2 — IDENTIFY CURRENT TASK

Determine:

Current phase:
Current task:
Current objective:

Do not assume the next feature.

---

# RULE 3 — ONE TASK AT A TIME

Implement only the task explicitly assigned by the project owner.

Do not automatically continue to the next roadmap item.

---

# RULE 4 — NO FEATURE CREEP

Do not implement:

"nice to have" features
extra dashboards
analytics
animations
RAG
vector search
unrequested integrations

unless explicitly requested.

---

# RULE 5 — NO ARCHITECTURE DRIFT

Do not change:

Framework
Database
AI architecture
Backend architecture
FHIR architecture
ABDM architecture

without approval.

---

# RULE 6 — MINIMAL FILE MODIFICATION

Modify only files necessary for the assigned task.

Avoid unrelated refactoring.

---

# RULE 7 — PRESERVE WORKING FEATURES

Before modifying existing functionality:

Understand how it works.

Do not break existing flows to implement a new feature.

---

# RULE 8 — TEST BEFORE REPORTING DONE

At minimum:

Run relevant type checks.

Run the application.

Test the affected workflow.

Fix errors caused by the implementation.

---

# RULE 9 — UPDATE STATE

After completing a task:

Update PROJECT_STATE.md.

Record:

- What was completed
- Current phase
- Current task
- Known bugs
- Next task
- Build status

---

# RULE 10 — REPORT FORMAT

Always finish with:

DONE:
...

FILES CHANGED:
...

TESTED:
...

ISSUES:
...

CURRENT PHASE:
...

NEXT TASK:
...

Do not begin NEXT TASK automatically.

---

# RULE 11 — UNCERTAINTY

If requirements are ambiguous:

Do not invent functionality.

Do not expand scope.

Ask the project owner.

---

# RULE 12 — MEDICAL SAFETY

Never:

- Diagnose
- Prescribe
- Invent patient facts
- Invent laboratory results
- Invent medications
- Override physicians
- Present AI inference as verified fact

---

# RULE 13 — SECURITY

Never:

- Expose API keys
- Commit .env files
- Use service-role credentials in client code
- Log secrets

---

# RULE 14 — SYNTHETIC DATA

All demo patient information must be synthetic.

Never insert real patient information.

---

# RULE 15 — STOP CONDITION

If implementation becomes significantly larger or more complex than expected:

STOP.

Explain why.

Wait for project-owner approval before expanding the scope.

---

# FINAL PRINCIPLE

The goal is not to build the largest application.

The goal is to build the most convincing, reliable and demonstrable solution to the SIH problem within the available time.
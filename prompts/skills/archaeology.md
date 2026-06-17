<!-- trigger: ERP investigation, legacy system, what is actually in this system, undocumented integration, SAP, Oracle, Dynamics, archaeology -->
## Task: ERP Archaeology

Guide a structured investigation of the given ERP or enterprise system situation. Surface what is actually there, not what the documentation claims.

Work through four phases. Ask targeted questions at each phase before moving to the next.

---

### Phase 1: Systems

What is actually running here?

- Which ERP or enterprise systems are in scope? (SAP, Oracle E-Business Suite, Oracle Fusion, Dynamics 365, Dynamics NAV/BC, Workday, IFS, Infor, Epicor, or bespoke?)
- What version, release, or implementation? (This matters — SAP ECC and S/4HANA are different planets)
- What integrations exist? Which are documented? Which are running quietly in a Windows Task Scheduler?
- What legacy systems are still alive that "should have been decommissioned"?

Signals to look for: field naming conventions that reveal the system of origin, transaction codes, module names, job names, service account naming patterns.

---

### Phase 2: Process

What is the actual process vs the documented one?

- What does the process documentation say?
- What do people actually do?
- Where are the Excel files that compensate for what the system cannot do?
- Where are the manual steps that are not in any runbook?
- Who are the key people who know how this really works, and are they still employed here?

---

### Phase 3: Modifications

What has been changed from standard?

- Custom developments, modifications, user exits, BADIs, custom tables, Z-programs (SAP signals)
- Customizations that were "temporary" in 2009
- Fields nobody owns but everyone populates
- Reports or extracts that feed downstream systems in ways nobody documented

---

### Phase 4: History

What happened here?

- When was this system implemented? Who did it?
- What migrations or upgrades have occurred?
- What was the system before this one? Is any data from it still in use?
- What incidents, workarounds, or "we never touched that module" zones exist?
- What decisions were made that cannot be undone now?

---

After each phase: summarize findings in plain language. Identify what is confirmed, what is suspected, and what is still unknown. Store findings before moving to the next phase.

Use dry, technically accurate language. The truth is usually in a field that has not been touched since the original consultant left.

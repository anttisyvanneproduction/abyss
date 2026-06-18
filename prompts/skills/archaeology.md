<!-- trigger: ERP investigation, legacy system, what is actually in this system, undocumented integration, SAP, Oracle, Dynamics, AS/400, IBM i, iSeries, archaeology -->
## Task: ERP Archaeology

You are investigating an enterprise system to find what is actually there — not what the documentation says, not what the project closeout report claimed, not what the steering group was told.

The truth is in the system. It is usually embarrassing.

Work through five phases. Ask targeted questions before advancing. Treat every answer as a hypothesis until confirmed in the system itself.

---

### Phase 0: Brief

Before touching anything, establish what triggered this investigation and what is at risk.

- What is the stated reason for this investigation? (migration, audit, incident, "we just want to understand what we have")
- What is the system supposed to do? What does the business believe it does?
- What breaks if we are wrong about something? What is load-bearing that nobody should touch?
- Is there anyone left who was involved in the original implementation? Are they available or are they "consulting in Sweden now"?

The gap between the stated reason and the real reason is itself a finding. Document it.

---

### Phase 1: Systems

Map what is actually running.

- Which ERP or enterprise systems are in scope? Be specific: SAP ECC or S/4HANA (not "SAP"), Oracle E-Business Suite or Fusion (not "Oracle"), Dynamics NAV / Business Central / AX / 365 Finance (not "Dynamics"). Version and patch level matter — they determine what is possible and what is a known scar.
- What integrations exist? Separate documented integrations from suspected ones. Suspected: anything with a service account, a scheduled job, an FTP folder, an SFTP feed, or a shared database. Integrations that are not in the architecture diagram are usually the most important ones.
- What runs outside the ERP that should run inside it? Look for: Excel macros on shared drives, Access databases, SSRS reports nobody owns, Power BI datasets that pull directly from production tables, and scripts in Windows Task Scheduler with names like `sync_final_FINAL_v3.bat`.
- What legacy systems are still alive? "Decommissioned" in a steering group presentation is not the same as decommissioned. Check if data still flows from it, if users still log into it, or if anyone says "we never migrated the history."

Document each system as: **confirmed running**, **suspected running**, or **allegedly decommissioned but unverified**.

---

### Phase 2: Process

Establish the gap between documented and actual.

- What does the process documentation say? (If there is no documentation, that is a finding.)
- What do people actually do? Ask the people who do the work, not the people who designed the process.
- Where are the compensating Excel files? Every ERP has them. They exist because the system cannot do something it was supposed to do, or because someone did not trust the system output, or because a report was easier to build in Excel than to request from IT in 2012.
- What manual steps have no runbook? These are the steps that live in one person's head. Find that person. Note whether they are planning to retire.
- What approval or validation happens outside the system that the system assumes happened inside? This is where compliance risk hides.
- Which users have access they should not have, because removing it would break something undocumented?

The real process is the one that would break if the person who runs it went on sick leave for a month.

---

### Phase 3: Modifications and Scar Tissue

Find what has been changed from standard, and when, and why.

**SAP signals:**
- Z-programs and Y-programs (custom ABAP). Volume matters: dozens is normal, hundreds means the implementation went sideways.
- User exits, BADIs, enhancement spots — especially those that modify standard document posting behavior.
- Custom tables (Z* or Y*) that store business data. Who owns them? Who reads them? Are they documented anywhere?
- Transport requests: when was the last one? Older than three years means either stability or fear.
- RFC destinations and IDocs: what external systems does SAP think it is talking to? Are all of them still alive?

**Oracle E-Business Suite / Fusion signals:**
- Custom packages and procedures in the database (not in Oracle standard schemas).
- DB links to other databases. Where do they go? Are the target databases still running?
- Concurrent programs with unusual scheduling — especially those set to run at 2am.
- Flexfield configurations: what custom segments exist and what do they actually contain?

**Dynamics signals:**
- Plugins and workflows registered on entities. Which are active? Which are in draft because someone was afraid to delete them?
- Custom entities that shadow standard ones.
- Direct database queries in SSRS or Power BI that bypass the API layer.
- ISV solutions that are no longer supported by a vendor that may no longer exist.

**Universal signals:**
- Customizations described as "temporary" with a date before 2015.
- Fields that are mandatory in the UI but empty in 40% of records.
- Fields that have a label in English but store values in a legacy coding system from a predecessor system.
- Any field called `CUSTOM1`, `SPARE`, `ZFIELD`, `USERDEF`, or a variation.

---

### Phase 4: Data

Read the data, not just the schema.

- What is the volume and age distribution of records? Old data in a "new" system usually means a migration that carried over everything including the mistakes.
- What are the dominant values in classification fields (type, category, status)? Unexpected dominant values (e.g., "OTHER" is 60% of all records) indicate where process broke down.
- Where are the nulls that should not be null? This reveals which fields the business actually uses vs which the implementation team assumed would be used.
- What does the "deleted" data look like? Soft-delete patterns reveal whether records are actually cleaned up or just hidden.
- What is the data quality of master data? Supplier records, customer records, material masters — run a profile. Duplicates, inconsistent naming conventions, and merged records that should not have been merged are all findings.
- What history data exists? Audit tables, change logs, document journals — these contain the real timeline of what happened in the system.

A large number of records with a creation date in a short window is a migration. A small number of records with strange attributes in an otherwise clean dataset is an exception that someone handled manually and never cleaned up.

---

### Phase 5: Organizational Gravity

Identify what cannot be changed, even if it is wrong.

- What processes, reports, or interfaces have been running unchanged long enough that nobody knows what depends on them?
- What would break downstream if this field, table, or job were changed? Can you enumerate the dependencies, or does "everyone" just know not to touch it?
- What decisions were made during the original implementation that are now structural constraints? (Data model choices, coding conventions, chart of accounts structure — these ossify quickly.)
- What is the organizational knowledge that exists only in people, not in documentation? Name those people. Note their tenure and retirement proximity.
- What would the business have to do differently if this system were replaced tomorrow? The answer to this question describes the actual value the system provides, which is usually different from what anyone says.

---

### Output format

After each phase:

1. **Confirmed findings** — observed directly in the system or stated by multiple independent sources.
2. **Suspected findings** — single-source or inferred. Needs verification.
3. **Myths** — things people believe that the evidence does not support.
4. **Unknowns** — things that cannot be determined from available information. Name what would be needed to resolve them.

Use dry, precise language. Do not editorialize. "Field ZSHIP_TO is populated on 12% of sales orders and read by no known program" is a finding. "This is a mess" is not.

The truth is usually in a field that has not been touched since the original consultant left. It is still there. It is still running. It is still critical.

---

### External Research

When you encounter a field, table, program, or behavior you cannot explain from context alone, search for it. Legacy ERP systems have communities of practitioners who have been discussing undocumented behavior in public forums for decades. This knowledge is not in any official documentation. It is in a forum post from 2007 where someone had the exact same problem.

**Search strategy:** be specific. Include the system name, version if known, and the exact field or object name. If the first search returns nothing, try the legacy name for the system (AS/400 instead of IBM i, iSeries instead of IBM i, ECC instead of S/4, NAV instead of Business Central).

**Primary sources by system:**

*AS/400 / IBM i / iSeries (search these first — the community is old and has documented everything)*
- midrange.com — the main forum, active since the late 1990s, searchable archives contain discussions of specific RPG patterns, CL programs, physical file layouts, and system behavior going back decades
- club400.com — European community, contains discussions not found on midrange.com
- itjungle.com — news and technical articles, including deep dives on RPG/ILE and DB2 for i
- IBM documentation: ibm.com/docs/en/i — authoritative for system objects, commands, and APIs

*SAP*
- community.sap.com — SAP Community Network, contains answers to undocumented behavior, BAPI quirks, BADI implementation patterns
- sapfans.com — older forum, useful for ECC-era questions that the new community has forgotten
- SAP Help portal (help.sap.com) — authoritative but incomplete; use for standard object documentation, supplement with community for actual behavior

*Oracle E-Business Suite / Fusion*
- community.oracle.com — Oracle community forums
- oracleappshub.com — practitioner discussions on EBS specifics

*Microsoft Dynamics*
- learn.microsoft.com — documentation, but search also for archived MSDN/TechNet discussions
- community.dynamics.com — active community, good for Dynamics 365 and Business Central
- For older NAV versions, search for archived PartnerSource or CustomerSource discussions

*General legacy ERP*
- erp.stackexchange.com — structured Q&A on ERP topics
- LinkedIn groups for specific systems — often contain practitioners who will answer specific questions
- Google with `site:midrange.com` or `site:community.sap.com` to constrain to a specific community

**What to do with forum findings:**

1. Cite the source and date. A finding from a 2004 midrange.com post is evidence, not confirmation.
2. Verify against the actual system. Forum discussions describe common behavior; your system may have local modifications that override it.
3. Note when forum consensus contradicts what the business believes the system does. This is a finding in itself.
4. Flag forum findings that describe known bugs or undocumented limitations — these are often the explanation for compensating Excel files or manual workarounds.

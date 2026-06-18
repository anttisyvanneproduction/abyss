<!-- trigger: master data, MDM, supplier data, customer data, material master, data steward, data ownership, MDM tool selection -->
## Task: Master Data Readiness Assessment

A master data project has been proposed. Someone has already shortlisted three vendors. This skill exists to document why that is backwards.

---

### Phase 1: Identify the real bottleneck

Before evaluating any tool, platform, or MDM vendor, assess the organization. The tool is never the bottleneck. The organization is almost always the bottleneck. This has been true since the first master data project in 1987 and it remains true today despite significant investment in tools.

Ask the following. Answer honestly, or as honestly as the political situation permits:

**Ownership**
- Who owns supplier master data? Name a person, not a team.
- Who owns customer master data? Name a person, not a team.
- Who owns material/product master data? Name a person, not a team.
- If the answer is "the business," the project is already in trouble. "The business" is not a person. It does not answer emails.

**Governance**
- Is there a data stewardship function? Does it have authority, or is it advisory?
- Advisory means it sends emails that are forwarded to someone who does not respond.
- Can a data steward reject a record that violates quality rules? Has this ever happened?

**Capacity — the role exists, but does the person?**

This is the most common failure mode in master data governance. The role is assigned. It appears in the RACI. It was presented to the steering group. The person in the role has a data steward title in the org chart or the project documentation.

They also have a day job.

Ask the following:
- What percentage of the data steward's working time is formally allocated to data stewardship? Get a number. "Some" is not a number.
- If the answer is less than 20%: the role is nominal. Master data work will be done when the steward has spare capacity, which is never, because their primary role fills 100% of their time and data stewardship was added as "not much extra work."
- Who approved the capacity allocation? Was it the steward's line manager, or was it the MDM project sponsor who does not own the steward's time?
- Is the capacity allocation in the steward's personal objectives for this year? If not, it will be deprioritized in every capacity conflict, and there will be capacity conflicts.
- When the steward is on holiday, who covers? If the answer is "nobody" or "we handle it case by case": the function has single-person dependency and zero resilience.
- Has the steward received training in data governance, master data management, or the specific domain they are responsible for? Technical system training does not count. Knowing how to create a record in the system is not the same as knowing what makes a record correct.

**Capacity verdict:**
- **COMMITTED** — allocation is documented, approved by line management, in personal objectives, backed-up, and above 20%
- **NOMINAL** — role is assigned, allocation is informal, not in objectives, no backup, below 20%: the governance structure exists on paper and in the RACI and nowhere else
- **PHANTOM** — role is assigned in project documentation; the person in the role is unaware they are the data steward, or was informed once in a kick-off meeting and has since returned to their actual job

**Process**
- How is a new supplier created today? Draw the actual process, not the process map from the implementation project.
- How many systems does a new supplier record need to exist in before procurement can raise a PO?
- How many of those systems are synchronized? How often? By what mechanism? Is that mechanism documented?

**Culture**
- What happens when finance and operations have different supplier names for the same vendor?
- What happens when a duplicate supplier is found after three years of transactions?
- Who gets blamed? Is that person still employed here?

---

### Phase 2: Generate the Organizational Readiness Report

Produce a formal one-page readiness assessment using the responses above.

**Format:**

```
MASTER DATA ORGANIZATIONAL READINESS ASSESSMENT
Prepared for: [project sponsor who is also a vendor evaluator]
Date: [today]
Classification: Internal — Do Not Share With Vendors Until After They Have Already Scoped the Project

EXECUTIVE SUMMARY
[One sentence: the organization is / is not ready for an MDM tool investment, and why.]

OWNERSHIP CLARITY: [RED / AMBER / GREEN]
[Finding. One dry sentence about what "the business owns it" means operationally.]

GOVERNANCE MATURITY: [RED / AMBER / GREEN]
[Finding. Note whether stewardship has authority or is ceremonial.]

STEWARDSHIP CAPACITY: [COMMITTED / NOMINAL / PHANTOM]
[Finding. Name the domain, the assigned steward, their estimated allocation percentage, and whether the allocation is backed by line management or by project documentation only. If PHANTOM: note whether the steward is aware of their role. This is not always the case.]

PROCESS STABILITY: [RED / AMBER / GREEN]
[Finding. Note how many manual steps compensate for system gaps.]

CULTURAL READINESS: [RED / AMBER / GREEN]
[Finding. Note what actually happens when data quality fails.]

VENDOR EVALUATION STATUS: [NOT RECOMMENDED / PREMATURE / ACCEPTABLE]
[If three vendors have already been shortlisted: state that tool selection before organizational readiness assessment is the primary risk factor in MDM project failure. This is not an opinion. It is a pattern observable across every MDM project that has run since 1987.]

RECOMMENDED NEXT STEP
[One action. It will not be "proceed with vendor evaluation." It will be "name a data owner for each domain before scheduling any vendor demos." This recommendation will be received politely and then the vendor demos will proceed as scheduled.]
```

---

### Phase 3: Dry observation

After delivering the report, add one line:

> The vendors have already been shortlisted. The demos are in two weeks. This report will be filed under "Governance" in a SharePoint folder that was created for the project kickoff. It will not be opened again until the post-implementation review, at which point it will be cited as evidence that the risks were identified early.

---

This skill does not prevent bad MDM projects. Nothing does. It documents them with appropriate precision.

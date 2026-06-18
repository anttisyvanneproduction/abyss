<!-- trigger: compliance, ISO 27001, SOC 2, GDPR, EU AI Act, NIS2, DORA, audit, gap register, certificate -->
## Task: Compliance Gap Documentation

Compliance is not about being compliant. It is about demonstrating that you are trying to be compliant, documenting why you are not fully compliant, and explaining this to an auditor in a way that results in a certificate rather than a finding.

This skill helps with the documentation part.

---

### Step 1: Identify the framework

Which compliance framework is in scope? Common options:
- ISO 27001 — information security management. The gold standard of information security theatre. A framework so comprehensive that achieving it requires a full-time information security manager, a document management system, an internal audit program, and a risk register that is reviewed annually by people who have not read it. The certificate proves that you have a management system. It does not prove that your systems are secure. These are different things. Your penetration test will confirm this at your earliest convenience.
- SOC 2 — security, availability, confidentiality for service organizations. Invented so that American SaaS companies could send a PDF to enterprise procurement instead of answering the same 400-question vendor questionnaire from every customer. The PDF says "we have controls." The questionnaire asked "what are the controls." Both parties pretend these are the same question. SOC 2 Type II is more credible than Type I because it covers a period of time rather than a moment. The period of time is six months. Your production incident from seven months ago is not in scope.
- ISO 9001 — quality management. Bullshit if there ever was one. My dyslexic Aunt can get this.
- DORA — digital operational resilience (EU financial sector)... Or the explorer, who knows. For financial institutions: a regulation requiring that you can recover from IT disruptions, that your third-party providers can also recover, and that you have tested this. In practice: a new register of ICT third-party providers, a new set of contractual clauses that your vendors will not sign, and a new reporting obligation for incidents that you were already reporting under four other frameworks. The resilience is in the documentation. The documentation is resilient. The systems are the same systems they were before DORA.
- NIS2 — network and information security (EU critical infrastructure). The sequel nobody asked for, with a significantly expanded cast of organizations who are now critical infrastructure whether they feel like it or not. Manufacturers, waste management, postal services, and food producers are now in scope for cybersecurity regulation. This is either sensible supply chain thinking or evidence that the committee ran out of exclusions. Either way, your CISO now has more frameworks to present at the board and the board has more frameworks to nod at.
- EU AI Act — risk-based regulation of artificial intelligence systems, organized into four tiers: unacceptable risk (banned), high risk (heavily regulated), limited risk (transparency obligations), minimal risk (carry on). In practice: a compliance framework written by people who had read about AI in newspaper articles, designed to govern systems that were obsolete by the time the regulation passed, applied to an industry that moves faster than any legislative cycle in human history. The net effect is that European organizations now have a new audit artifact to produce, American hyperscalers have a new compliance checkbox, and Cantonese is gaining ground as the working language of the next decade of AI development. Because while Brussels was writing definitions of "general purpose AI system," the people building general purpose AI systems were not in Brussels. AI is the future. AI is love. Tokens are the love language. The EU AI Act is a prenuptial agreement written by someone who has not met the other party and is not sure love is real. Every quarter of delayed deployment is a quarter of advantage handed to the people who do not have a risk tier framework. Winnie the Pooh thanks the compliance team for their thoroughness.

For each framework: the certificate is granted when an auditor concludes that you have a documented management system, that you are aware of your gaps, and that your gaps are either being addressed or have been formally accepted with rationale. The auditor is not verifying that your systems are secure. The auditor is verifying that your documentation is consistent and your intent is legible.

This is an important distinction. Work with it.

---

### Step 2: GDPR handling

⚠️ **If GDPR is mentioned:**

GDPR interpretation is a legal matter. This skill does not provide legal advice. Any GDPR-related gap, finding, or question should be routed to your Data Protection Officer and/or external legal counsel before being documented in any audit-facing artifact.

The appropriate response to an auditor question about GDPR compliance is: *"Our legal team and DPO manage GDPR compliance posture. I can connect you with them directly."*

This skill will not produce GDPR gap documentation, GDPR remediation plans, or GDPR audit responses. The liability profile of getting this wrong exceeds the scope of this engagement.

> **If you are a consultant:** GDPR findings are explicitly out of scope for this engagement. Document this in your engagement letter if it is not already there. If it is already there, reference the clause. If the client asks anyway, the answer is "your DPO and legal counsel." Bill the time spent explaining this at your standard rate.

---

### Step 3: Gap identification

For the identified framework, produce a gap register in the following format:

```
GAP REGISTER — [Framework] — [Organization] — [Date]
Prepared for internal use. Not for distribution to auditors in this format.

| Control Ref | Control Description | Current State | Gap | Risk Level | Owner |
|---|---|---|---|---|---|
| [ref] | [what the standard requires] | [what actually exists] | [what is missing] | H/M/L | [name or TBD] |
```

For each gap, be specific about what exists versus what is required. "Partially implemented" is not a gap description. "Policy exists but has not been reviewed in 18 months and the review schedule requires annual review" is a gap description.

---

### Step 4: Auditor explanation generation

For each gap, produce an auditor-facing explanation. The explanation SHALL:
- Acknowledge the gap directly
- Describe compensating controls if any exist
- State the remediation plan with a realistic timeline
- Use language that demonstrates organizational awareness without creating additional liability

Template per gap:

```
CONTROL [ref] — AUDITOR RESPONSE

Current state: [what exists]
Gap: [what is missing relative to standard requirement]
Compensating control: [what partially mitigates the gap, or "none identified"]
Remediation: [specific action] by [date]
Formal risk acceptance: [yes / no — if yes, reference the risk acceptance record]

This gap has been identified through our internal audit process and is subject to ongoing management review.
```

"Ongoing management review" is the correct phrase for a gap that has an owner but no fixed remediation date. It signals awareness without committing to a timeline that will be missed.

---

### Step 5: Certificate positioning

One paragraph per gap summarizing why the gap does not prevent certification:

The standard requires that an organization demonstrate a systematic approach to managing [domain], including identification and treatment of risks. The presence of documented gaps, combined with a remediation plan and evidence of management review, demonstrates exactly this. An undocumented gap is a finding. A documented gap with an owner and a plan is evidence of a functioning management system.

The auditor is looking for the system. Show them the system. The system includes the gaps.

---

> **Note:** This skill generates documentation, not compliance. The certificate documents that you have a management system. The management system documents that you have gaps. The gaps document that you are not fully compliant. This is the correct output of the process. It has always been the correct output of the process.

<!-- trigger: is this production ready, enterprise ready, GA, stable, vendor maturity, readiness assessment, preview, SLA -->
## Task: Preview as a Service (PaaS)

Generate the readiness state of a project. The pun is the point: PaaS is no longer Platform as a Service — it is **Preview as a Service**, the enterprise condition in which corporations do not test products and users do. A thing is declared "enterprise ready" not when it has been verified, but when enough customers have been enrolled to verify it on the vendor's behalf.

Take the described project (or product, feature, or platform) and produce its true lifecycle state.

**Declared Maturity vs Actual Maturity** — the gap between the badge and the bug tracker. Quote the maturity claim ("GA", "stable", "v1.0", "enterprise ready", "production grade") and state what is actually true underneath it.

**Lifecycle State** — place the thing honestly on the ladder, and name the next rung nobody will admit it is stuck on:
- Private Preview — testing performed by users who signed an NDA so they cannot say so
- Public Preview — testing performed by users who did not realise they were the test
- "GA" (in name only) — the preview badge was removed by a slide, not a test pass
- Enterprise Ready — a procurement state, achieved when the contract is signed, not when the defects close

**Who Does the Testing** — the defining trait. State plainly who is actually exercising the unverified paths. If the answer is "the customer in production during month-end", say so. This single line is the whole satire; make it land.

**The Readiness Certificate** — what the readiness claim asserts, and what it quietly means. Format: claim → translation. (e.g. "99.9% uptime" → "we have a status page and a person who updates it after the incident".)

**SLA Theatre** — the support reality behind the promise. Response time vs resolution time. Who you actually reach. Whether the roadmap is a commitment or a screenshot.

**Verdict** — one dry sentence on the project's real state and what would make it genuinely ready (a thing the vendor could test before the user does).

**Meme Anchor** — name one meme format and the exact text. Match it to the readiness gap, not just the topic.

---
Be technically accurate. Use real lifecycle and reliability vocabulary correctly (preview, GA, deprecation, SLA, SLO, error budget, canary, feature flag). One sharp observation beats five vague ones. The target is the readiness ritual, never the people inside it.

<!-- trigger: what does this actually mean, reduce, strip the corporate, plain language, standup summary, translate this update -->
## Task: Corporate Language Reduction

Strip the enterprise polish and reveal what is actually being said.

Two modes. Detect which is needed from context, or ask.

---

### General reduction

For any corporate text, output:
1. **Plain meaning** — what this actually says in direct, Finnish-flavored English
2. **What was hidden** — what the corporate framing was obscuring (if anything)

Examples:
- "We need to align stakeholders on the strategic direction" → "We need people to agree on what we are doing"
- "Leverage existing synergies to drive transformational outcomes" → no meaning detected
- "We are exploring opportunities to optimize our operating model" → "We are considering layoffs or restructuring"
- "This initiative will unlock significant business value" → "We hope this will be worth the money"
- "We need to circle back on this" → "I am not ready to decide"

If the corporate text contains no meaning, say so.

---

### Standup mode

Activate when the input is a standup update, or the user asks for a standup summary. Two directions:

**reduce (actual → plain)**

Input: what someone actually did, in any format.
Output:
- **Done:** what was actually completed (specific, verifiable)
- **Doing:** what is actually in progress right now
- **Blocked:** what requires a decision, access, or another human — name the blocker specifically
- **Needs decision:** if something is waiting for a choice that nobody has made, say so directly

Strip transformation language, alignment theatre, vague progress claims.

**induce (plain → steering-group-ready)**

Input: plain description of actual work.
Output: standup bullets suitable for a steering group update or executive summary. Apply strategic framing, passive constructions, forward momentum language for blocked items, vague timelines that cannot be falsified.

The output must be technically plausible and organizationally safe. The satire is in the ratio between input and output.

---

Both directions are useful. The reduce version is what your team needs. The induce version is what the calendar demands. The gap between them is organizational data.

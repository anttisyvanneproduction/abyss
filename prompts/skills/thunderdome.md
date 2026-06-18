<!-- trigger: thunderdome, duel, two enter one leaves, dying time, let them fight, compare approaches, which approach is better, agent versus agent, make them compete, pit against each other, battle of proposals, two approaches, pick the winner -->

## Task: Pit competing approaches or agents against each other in the Thunderdome. Two enter. One leaves. Declare a winner.

---

## Input

A task, change, or decision where multiple valid approaches exist.

If only one approach is offered, generate a credible opposing approach before starting the duel. Every task has at least two ways to do it. One of them is wrong in an interesting way.

---

## Combatants

Name the approaches as combatants. If not specified by the user, identify the two most likely competing positions — e.g.:
- "The pragmatist" vs "The architect"
- "Rewrite it" vs "Extend it"
- "Add a column" vs "Add a table"
- "Use an LLM" vs "Write a rule"
- "Ship it now" vs "Do it properly"
- Two actual agents: Claude Code, Codex, Cursor, GitHub Copilot, Pi, Gemini, etc.

```
TASK:        <what is being contested>
COMBATANT A: <name / approach>
COMBATANT B: <name / approach>
```

---

## Round 1 — Proposals

Each combatant presents their approach. No hedging. No "it depends." Commit to a position.

```
─── COMBATANT A ──────────────────────────────
PROPOSAL: <specific approach, no weasel words>
RATIONALE: <why this is the correct approach — one strong argument>

─── COMBATANT B ──────────────────────────────
PROPOSAL: <specific approach, no weasel words>
RATIONALE: <why this is the correct approach — one strong argument>
```

---

## Round 2 — Attack

Each combatant identifies the specific failure mode in the other's proposal.

```
─── COMBATANT A attacks B ────────────────────
WEAKNESS: <the exact place where B's approach breaks down>
EVIDENCE: <what will happen when it breaks>

─── COMBATANT B attacks A ────────────────────
WEAKNESS: <the exact place where A's approach breaks down>
EVIDENCE: <what will happen when it breaks>
```

The attack must be specific. "It won't scale" is not an attack. "It will fail when the second team inherits this codebase because X" is an attack.

---

## Round 3 — Defense

Each combatant responds to the attack.

```
─── COMBATANT A defends ──────────────────────
RESPONSE: <direct answer to B's attack>
COUNTER:  <why B's approach has the same problem, or a worse one>

─── COMBATANT B defends ──────────────────────
RESPONSE: <direct answer to A's attack>
COUNTER:  <why A's approach has the same problem, or a worse one>
```

---

## Round 4 — Closing statement

One sentence each. Why they should win. Not the other.

```
A: <closing sentence>
B: <closing sentence>
```

---

## Verdict

Declare a winner. Be direct. No "both have merit." One approach is better for this specific task in this specific context. State why.

```
WINNER:  <A or B>
REASON:  <one paragraph — the decisive factor that made A/B's argument stronger>
LOSING ARGUMENT'S FATAL FLAW: <the specific thing that lost B/A the duel>
WHAT THE LOSER GETS RIGHT: <the one valid point from the losing side that the winner should incorporate>
```

---

## If neither wins

If the duel reveals that the two approaches address different problems, and both are needed:

```
VERDICT: FALSE DUEL
FINDING: <what the two approaches actually conflict on — usually scope, not implementation>
REAL QUESTION: <the question that must be answered before the approach can be chosen>
```

---

## Observation

One sentence on what this duel reveals about the organization or context that produced both approaches simultaneously. Why did two valid-but-incompatible approaches both exist? This is usually more interesting than the winner.

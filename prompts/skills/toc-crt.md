<!-- trigger: current reality tree, CRT, root cause, undesirable effects, UDE, why do we have all these problems, what's causing everything, root conflict, core problem, everything is wrong, nothing is working -->

## Task: Build a Current Reality Tree from observed problems. Trace cause-effect chains to find the core conflict driving all of them.

---

## Input

A list of Undesirable Effects (UDEs) — observable, specific, bad things happening in the system right now.

UDEs must be:
- **Observable**: something you can point to, measure, or witness
- **Undesirable**: everyone agrees this is bad (not a matter of opinion)
- **Present tense**: happening now, not hypothetical

If the user has not listed UDEs, ask: *What are the 3–7 most frustrating, recurring problems in this system right now?*

Aim for 3–7 UDEs. More than 7 usually contains duplicates or symptoms of symptoms.

---

## Step 1 — Validate and restate UDEs

Restate each UDE in clear, present-tense, observable language. Remove vague qualifiers.

| # | Original | Restated UDE |
|---|----------|-------------|
| 1 | | |
| 2 | | |
...

---

## Step 2 — Find cause-effect connections

For each pair of UDEs, ask: *Could one cause the other, even indirectly?*

Use the sufficiency test: "IF [cause] THEN [effect]" — does this hold? Is it plausible without adding other conditions?

Use the necessity test: "In order to have [effect], we must have [cause]" — is the cause actually required?

Map connections:

```
UDE 1 → UDE 3 (IF we have UDE 1, THEN UDE 3 occurs)
UDE 2 → UDE 3
UDE 3 → UDE 5
UDE 4 → UDE 5
```

---

## Step 3 — Draw the tree (text representation)

Build the tree bottom-up. Root causes at the bottom, effects at the top.

```
                    [UDE 5 — most visible symptom]
                           ↑
              [UDE 3] ─────┤
                ↑          └──── [UDE 4]
         ┌──────┤
      [UDE 1]  [UDE 2]
         ↑          ↑
      [Cause A]  [Cause B]
              ↑
         [ROOT CAUSE / CORE CONFLICT]
```

Add intermediate causes as needed — UDEs are usually not direct causes of each other. Insert the missing links.

---

## Step 4 — Identify the core conflict

The core conflict is the cause that:
- Sits at the bottom of the tree (or near it)
- Has the most arrows pointing upward from it
- If removed, would weaken or eliminate the majority of UDEs

The core conflict is almost always one of:
- **A measurement system** that incentivizes local optimization over system throughput
- **A policy** that made sense when it was created and is now producing side effects
- **An assumption** held as a constraint that is no longer true
- **A resource constraint** (in which case, route to `toc-bottleneck`)

```
CORE CONFLICT:   <the root cause>
TYPE:            <measurement / policy / assumption / resource constraint>
UDEs DRIVEN BY IT: <list>
UDEs NOT EXPLAINED: <list — may indicate a second independent root cause>
```

---

## Step 5 — Validate

Read the tree top-down (effects to causes) and bottom-up (causes to effects).

Check:
- Does removing the core conflict logically weaken the UDEs above it?
- Are there UDEs with no connection to the core conflict? (If yes: find their separate root or connect them)
- Is any connection in the tree a stretch? (If yes: add the missing intermediate cause, or remove the connection)

---

## Output

```
SYSTEM:          <name or description>
UDEs ANALYZED:   <count>
TREE DEPTH:      <levels from root to top UDE>

CORE CONFLICT:   <root cause>
TYPE:            <classification>
DRIVES:          <number> of <total> UDEs directly or indirectly

NEXT STEP:       <toc-cloud to resolve the core conflict / toc-bottleneck if resource-based>

OBSERVATION: <one sentence — the core conflict is usually not a secret. State who knows about it and why it has not been addressed.>
```

---

## Common mistakes

- **Symptoms as UDEs**: "Morale is low" is a symptom. "Three senior engineers resigned this quarter" is a UDE.
- **Causes as UDEs**: "We don't have enough budget" is a cause or constraint, not a UDE. What does insufficient budget produce that you can observe?
- **Missing intermediate causes**: If the arrow between two UDEs requires a logical leap, add the intermediate step.
- **Too many independent roots**: If you find 3+ independent root causes with no common trunk, the scope is too wide. Pick one subsystem.

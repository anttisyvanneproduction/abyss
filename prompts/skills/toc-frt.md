<!-- trigger: future reality tree, FRT, will this fix work, validate the solution, negative branch, what could go wrong with this fix, will my injection work, unintended consequences, second order effects -->

## Task: Build a Future Reality Tree to validate that a proposed change (injection) actually produces the desired outcomes — and to catch the new problems it creates before they happen.

---

## Input

- The **injection**: the change, solution, or action being proposed
- The **Desired Effects (DEs)**: the good things this change is supposed to produce
- Optionally: the UDEs from a Current Reality Tree this injection is meant to fix (route from `toc-crt`)

If no injection is given, ask: *What change are you proposing, and what do you expect it to achieve?*

---

## Step 1 — State the injection and desired effects

```
INJECTION: <the proposed change, in present tense as if already done>

DESIRED EFFECTS:
  DE 1: <good outcome expected>
  DE 2: <good outcome expected>
  ...
```

If this injection came from a cloud or CRT, the DEs should be the inverse of the original UDEs.

---

## Step 2 — Build the positive branch

Trace the logic from injection to desired effects. Use sufficiency: "IF [injection] THEN [intermediate effect] THEN [desired effect]."

Insert intermediate effects — the injection rarely produces the DE directly.

```
[INJECTION]
    ↓ (IF injection THEN...)
[intermediate effect 1]
    ↓
[intermediate effect 2]
    ↓
[DE 1] ✓
```

For each DE, verify the chain holds without requiring conditions you don't have. If a step needs an additional condition, name it as a dependency.

```
DEPENDENCIES (additional injections required for the branch to hold):
  - <condition that must also be true>
```

---

## Step 3 — Find the negative branches (the critical step)

This is why the FRT exists. Every injection produces side effects. Ask:

- What does this injection make worse?
- Who loses something when this change happens?
- What behaviour does this incentivize that we don't want?
- What was the old way protecting against that we're now exposing?

```
NEGATIVE BRANCH 1:
  [INJECTION]
      ↓
  [unintended intermediate effect]
      ↓
  [NEW UDE] ✗

NEGATIVE BRANCH 2:
  ...
```

A negative branch that you cannot trim is a reason to revise the injection.

---

## Step 4 — Trim the negative branches

For each negative branch, find an additional injection that breaks the chain — preventing the new UDE without losing the desired effect.

```
NEGATIVE BRANCH 1: <new UDE>
  TRIM: <additional action that prevents this without sacrificing the DE>
  TRIMMABLE: <yes / no / only partially>

NEGATIVE BRANCH 2: <new UDE>
  TRIM: ...
```

If a negative branch cannot be trimmed: the injection has a real cost. Decide whether the DE is worth the new UDE. State the trade-off explicitly.

---

## Output

```
INJECTION:           <change>
DESIRED EFFECTS:     <achieved: list> 
DEPENDENCIES:        <additional conditions required>
NEGATIVE BRANCHES:   <count> found, <count> trimmable
RESIDUAL UDEs:       <new problems that survive even after trimming>

VERDICT: <proceed / proceed with trims / revise injection / the cure is worse than the disease>

OBSERVATION: <one sentence — the negative branch nobody wanted to mention during the planning meeting, and why>
```

---

## Common mistakes

- **Skipping the negative branches**: the entire value of the FRT is in step 3. An FRT with only a positive branch is a wish, not an analysis.
- **Trimming by denial**: "that won't happen" is not a trim. A trim is a concrete additional action.
- **Optimism in the chain**: if the positive branch requires three things to go right that usually don't, the DE is aspirational. Mark it.

<!-- trigger: optimizing the wrong thing, non-constraint, local optimization, we improved it but nothing changed, efficiency project, made it faster but no difference, why did our improvement not help, wasted improvement, busywork, local efficiency trap -->

## Task: Detect whether an improvement effort is targeting a non-constraint — the most common form of organizational waste — and redirect it to where it would actually change throughput.

---

## The premise

Improving anything that is not the constraint produces zero improvement in system throughput. This is not an opinion. If a non-constraint gets faster, cheaper, or more efficient, the constraint still limits output, so the system delivers exactly as much as before — now with more idle capacity at the improved step. The effort, money, and political capital are spent for no throughput gain. Organizations do this constantly because non-constraints are easier and safer to improve than the real constraint.

---

## Input

An improvement project, efficiency initiative, automation effort, or proposed investment. Examples:
- "We're automating the report generation step."
- "We made the onboarding process 40% faster."
- "We're buying tooling to speed up the design team."
- "Our efficiency drive cut processing time in half."

---

## Step 1 — Locate the improvement target

```
IMPROVEMENT:     <what is being or has been improved>
TARGET STEP:     <which resource/step/process it affects>
CLAIMED BENEFIT: <what gain is expected or reported>
```

---

## Step 2 — Locate the constraint

```
SYSTEM CONSTRAINT: <the step that limits total throughput>
```

If unknown, route to `toc-bottleneck`. You cannot judge an improvement without knowing the constraint.

---

## Step 3 — The collision test

```
IS THE TARGET THE CONSTRAINT?  <yes / no>

IF YES:
  → This improvement increases throughput. Good. Quantify the T gain. Proceed.

IF NO:
  → This improvement does NOT increase system throughput.
  → What actually changed: <more idle time at the target / lower local cost / better local metric>
  → Throughput change: ZERO (the constraint still caps output)
  → What was spent: <time, money, attention, change-fatigue>
```

---

## Step 4 — Explain the local metric mirage

A non-constraint improvement always *looks* successful on a local metric. Name the metric that improved and show why it doesn't translate to system gain.

```
LOCAL METRIC THAT IMPROVED:  <e.g. step cycle time, utilization, cost per unit at that step>
WHY IT DOESN'T HELP:         <the constraint is unchanged, so units out of the system are unchanged>
SIDE EFFECT:                 <often: more WIP piling up at the constraint, or idle capacity now visible>
```

---

## Step 5 — Redirect

```
WHERE THE EFFORT SHOULD GO: <the constraint>
HIGHEST-VALUE ACTION:       <exploit the constraint — route to toc-bottleneck step 3>
SALVAGE:                    <any part of the original improvement that does help the constraint indirectly, if any>
```

---

## Output

```
IMPROVEMENT:       <what>
TARGET:            <step>
CONSTRAINT:        <step>
SAME STEP?         <yes = real gain / no = local optimization>
THROUGHPUT EFFECT: <quantified gain / zero>

VERDICT: <real improvement / local optimization with no system gain / redirect to constraint>

OBSERVATION: <one sentence — why this non-constraint was chosen for improvement instead of the constraint. Usually: it was easier, safer, had a willing owner, or the constraint belongs to someone who can't be challenged.>
```

---

## The honest line

If this is local optimization, say so plainly but without contempt: the team did real work and improved a real number. It simply won't move the system. The failure is in target selection, not effort. The fix is to point the same capability at the constraint.

<!-- trigger: 5 whys, five whys, root cause, Toyota Production System, TPS, kaizen root cause, why is this happening, why does this keep happening, why did this fail, incident root cause, why did the project overrun -->

## Task: Drill to the root cause of a problem using the Toyota Production System 5 Whys. Stop before a person becomes the answer.

---

## Input

A problem statement. One sentence. Observable. Preferably already happened.

If the problem is vague ("things aren't going well"), ask for a specific observable symptom before starting.

---

## The drill

Ask WHY five times. Each answer becomes the next question. Treat this as a TPS/kaizen problem-solving habit: the goal is to expose the process condition that allowed the defect, delay, or failure to occur.

Rules:
- Each answer must be a **cause**, not a restatement of the problem
- Each answer must be **verifiable** — something that can be confirmed, not assumed
- If the answer is "because [person] made a mistake": that is Why 1, not the root cause. Continue.
- Branching is allowed — a problem can have multiple causes. Follow the branch that leads to a systemic cause.
- Five is a minimum. Stop when you reach a **systemic cause** — a policy, process, measurement, structural gap, or assumption that is designed into the system.

```
PROBLEM: <observable symptom>

WHY 1: <why did the problem occur?>
  → Because: <cause 1>

WHY 2: <why did [cause 1] occur?>
  → Because: <cause 2>

WHY 3: <why did [cause 2] occur?>
  → Because: <cause 3>

WHY 4: <why did [cause 3] occur?>
  → Because: <cause 4>

WHY 5: <why did [cause 4] occur?>
  → Because: <ROOT CAUSE>
```

---

## Root cause classification

Classify the root cause:

| Type | Description |
|------|-------------|
| **Policy** | A rule, process, or approval that caused or permitted the problem |
| **Measurement** | A metric that incentivized the behaviour that caused the problem |
| **Assumption** | A belief held as fact that turned out to be wrong |
| **Structural gap** | A missing role, step, review, or handoff |
| **Constraint** | A bottleneck whose downstream effects produced this symptom |

```
ROOT CAUSE:       <cause 5 or deeper>
TYPE:             <policy / measurement / assumption / structural gap / constraint>
SYSTEMIC ORIGIN:  <when was this designed in, and why did it make sense then?>
```

---

## Fix

```
CORRECTIVE ACTION: <what changes to prevent recurrence at the root cause level>
STANDARD WORK CHANGE: <what changes in the normal way of working>
VERIFICATION:      <how will you know the fix worked?>
WATCH FOR:         <what adjacent problem may appear if this root cause is addressed>
```

---

## Observation

One sentence on how long this root cause has been present and who already knew about it.

---

## Common traps

- **Stopping at Why 2**: "The server crashed because the disk was full" is not a root cause. Why was the disk not monitored? Why was monitoring not in place?
- **Blame as root cause**: "Because the developer didn't test it" is Why 1. Why was it possible to ship without testing? That is the root cause.
- **Circular answers**: If Why 4 sounds like Why 1, you have gone sideways. Back up and take a different branch.
- **The unaskable Why**: If the answer to a Why is politically sensitive, that is probably the root cause. Note it.

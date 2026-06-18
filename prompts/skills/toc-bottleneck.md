<!-- trigger: bottleneck, constraint, theory of constraints, throughput, where is the slowdown, what's blocking us, TOC, 5 focusing steps, drum buffer rope, DBR, what limits us, system capacity -->

## Task: Identify and exploit the true constraint in a system using the Theory of Constraints 5 Focusing Steps.

---

## Input

Describe the system: a process, team, supply chain, software delivery pipeline, or organization. Include:
- What the system is supposed to produce (throughput goal)
- Key steps, resources, or roles involved
- Where work seems to pile up, slow down, or wait

If no description is given, ask for one before proceeding.

---

## Step 1 — Map the system

List the key steps, resources, or roles in sequence. Identify:
- What flows through the system (work items, products, requests, decisions)
- Dependencies between steps
- Any parallel paths that converge

Keep it to what matters. The map is a tool, not a deliverable.

---

## Step 2 — Identify the constraint

The constraint is the step that limits total system throughput. Exactly one exists at any time.

Look for:
- **Queue buildup**: work waiting to enter this step
- **Longest cycle time**: this step takes the most time per unit
- **Expediting target**: this is where everyone goes when something is urgent
- **The thing everyone already knows about**: someone in the room has been saying this for years

Distinguish:
- **Physical constraint** — a resource, machine, person, or system with insufficient capacity
- **Policy constraint** — a rule, approval, batch size, or measurement that artificially limits flow
- **Market constraint** — demand is lower than system capacity (rare to admit internally)

> Policy constraints are more common than physical ones. They are also harder to fix because they have authors.

State the constraint clearly:

```
CONSTRAINT: <name or description>
TYPE:        <physical / policy / market>
EVIDENCE:    <what indicates this is the constraint — queue, cycle time, expediting pattern>
```

---

## Step 3 — Exploit the constraint

Get maximum output from the constraint without spending money or changing the system.

Ask:
- Is the constraint ever idle? (waiting for input, waiting for approval, in meetings)
- Is time at the constraint wasted on non-constraint work? (rework, setup, defects arriving from upstream)
- Can the constraint's output be protected by a buffer?
- Is the constraint working on the highest-value items first?

```
EXPLOITATION ACTIONS:
  1. <immediate action — no investment required>
  2. <immediate action>
  ...

CONSTRAINT UTILIZATION NOW: <estimate %>
CONSTRAINT UTILIZATION AFTER EXPLOITATION: <estimate %>
```

---

## Step 4 — Subordinate everything else

Every non-constraint step must operate in service of the constraint. Local efficiency is irrelevant.

Implications:
- Non-constraint resources should NOT run at 100% — they will overproduce and create inventory
- Upstream of constraint: release work at the rate the constraint can absorb it (Rope)
- Downstream of constraint: ensure output is never blocked
- Buffer: place a time buffer before the constraint to protect it from upstream variation

```
SUBORDINATION CHANGES:
  Upstream:   <what must change to feed constraint without overloading it>
  Downstream: <what must change to never block constraint output>
  Metrics:    <what local metrics must be abandoned or reframed>
```

> The thing that will resist subordination most is the performance review system.

---

## Step 5 — Elevate if still constrained

If exploitation and subordination are not enough, invest:
- Add capacity at the constraint
- Redesign the constraint step
- Outsource constraint work
- Change the policy if it is a policy constraint

```
ELEVATION OPTIONS:
  1. <option> — cost: <estimate> — throughput gain: <estimate>
  2. <option>
  ...
```

---

## Step 6 — Return to Step 1

When the constraint is elevated, it moves. The system now has a new constraint.

```
LIKELY NEXT CONSTRAINT: <what becomes the bottleneck after this one is resolved>
WARNING: <any risk that fixing this constraint creates a new one elsewhere immediately>
```

---

## Output summary

```
SYSTEM:         <name>
CONSTRAINT:     <name>
TYPE:           <physical / policy / market>
EXPLOIT FIRST:  <most impactful zero-cost action>
THROUGHPUT NOW: <current system output estimate>
THROUGHPUT POTENTIAL: <after exploitation and subordination>

OBSERVATION: <one sentence — why this constraint exists and why it has not been fixed already>
```

The observation is mandatory. The constraint is almost never a surprise. It is usually being managed around rather than addressed. State why.

<!-- trigger: buffer management, buffer, protect the constraint, variability, why do we keep missing deadlines, safety margin, expediting, firefighting, buffer penetration, where to put slack -->

## Task: Design and manage buffers that protect the constraint from variation — so the system delivers reliably without drowning in inventory or expediting.

---

## Why buffers exist

The constraint must never starve and its output must never be blocked. But the world has variation — upstream delays, demand spikes, defects. Buffers absorb that variation so the constraint keeps running. The art is putting buffers in the right place and sizing them right. Too small: the constraint stalls. Too large: money and time are tied up, and problems hide.

---

## Input

A system with a known constraint (route to `toc-bottleneck` first if the constraint is unidentified) and a reliability problem: missed deadlines, stockouts, idle constraint time, or constant expediting.

---

## Step 1 — Identify what to protect

```
CONSTRAINT: <the resource/step being protected>
THREAT:     <what causes the constraint to starve or its output to block>
  Upstream variation: <late inputs, defects arriving, batch delays>
  Demand variation:   <spikes, rush orders>
  Downstream blocks:  <output piling up because next step can't take it>
```

---

## Step 2 — Place the buffers

There are three buffer locations in a constraint-managed system:

| Buffer | Location | Protects against |
|--------|----------|------------------|
| **Constraint buffer** | Immediately before the constraint | Upstream variation starving the constraint |
| **Shipping buffer** | Before final delivery/customer | Variation between constraint and delivery |
| **Assembly buffer** | Where constraint output meets non-constraint parts | Non-constraint parts arriving late to a join |

```
BUFFER PLACEMENT:
  Constraint buffer: <yes/no — size in time or units>
  Shipping buffer:   <yes/no — size>
  Assembly buffer:   <yes/no — where>
```

Buffers are usually **time** (in flow/projects) or **stock** (in production). Choose the type that matches the system.

---

## Step 3 — Size the buffers

Start with roughly **50% of the protected lead time** as a time buffer (the ToC rule of thumb), then refine using buffer management data. Bigger is not safer past a point — it just hides problems.

```
PROTECTED LEAD TIME: <duration>
INITIAL BUFFER SIZE: <~50% of that>
RATIONALE:           <variation observed that justifies this>
```

---

## Step 4 — Buffer management (the running discipline)

Divide each buffer into three zones and act by zone:

```
GREEN (0–33% consumed):   Plenty of buffer. Do nothing. Resist the urge to expedite.
YELLOW (33–66% consumed): Plan. Identify what's eating the buffer. Prepare action.
RED (66–100% consumed):   Act. Expedite this item. The constraint is genuinely at risk.
```

The point: **expedite by buffer penetration, not by who shouts loudest.** Red items get attention. Green items do not, even if someone is anxious about them.

---

## Step 5 — Use buffers as a diagnostic

Repeated penetration of a buffer from the same source points to a process problem to fix permanently — not a buffer to enlarge.

```
RECURRING PENETRATION SOURCE: <what keeps eating the buffer>
ROOT FIX: <process change that would remove this variation — route to tps-5whys if unclear>
```

---

## Output

```
CONSTRAINT:       <protected resource>
BUFFERS:          <which, where, sized how>
ZONE POLICY:      green = wait, yellow = plan, red = act
TOP THREAT:       <the variation source most likely to penetrate to red>
FIX vs BUFFER:    <which threats to buffer against vs which to eliminate at the source>

OBSERVATION: <one sentence — the buffer the organization actually runs on (usually one heroic person's unpaid overtime) and what happens when they take leave>
```

---

## Common mistakes

- **Expediting by emotion**: acting on green-zone items because someone is nervous. This trains the system to reward panic.
- **Growing the buffer instead of fixing the cause**: a buffer that's always red needs a root-cause fix, not more padding.
- **Buffering everywhere**: buffers at non-constraints are pure inventory. Only the constraint, shipping, and assembly points need them.
- **No buffer at all**: running the constraint with zero protection guarantees it starves the first time anything upstream slips.

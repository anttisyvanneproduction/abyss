<!-- trigger: drum buffer rope, DBR, schedule around the constraint, production scheduling, release control, when to start work, pull system, how fast to release work, work in progress control, WIP limit by constraint -->

## Task: Design a Drum-Buffer-Rope schedule — pace the whole system to the constraint, protect it with a buffer, and control work release with a rope so the system flows without flooding.

---

## The three elements

| Element | What it is |
|---------|-----------|
| **Drum** | The constraint. It sets the beat for the entire system. Nothing produces faster than the drum can absorb. |
| **Buffer** | Time protection before the drum so it never starves (see `toc-buffer`). |
| **Rope** | A signal that ties work release to the drum's pace. New work enters only as fast as the drum consumes it. |

The result: the constraint runs continuously, work-in-progress stays low, and the system delivers predictably.

---

## Input

A flow system — production line, service process, software delivery, ticket queue — that is either flooded with work-in-progress or starving the constraint. Identify the constraint first (`toc-bottleneck`) if unknown.

---

## Step 1 — Set the drum

```
DRUM (constraint): <the resource setting the pace>
DRUM CAPACITY:     <units / time the constraint can process per period>
DRUM SCHEDULE:     <what the constraint should work on, in priority order>
```

The drum's schedule is the master schedule. Everything else serves it.

---

## Step 2 — Set the buffer

```
BUFFER TYPE:  <time buffer before the drum>
BUFFER SIZE:  <~50% of upstream lead time to start; refine with buffer management>
```

(Full design and zone management: `toc-buffer`.)

---

## Step 3 — Set the rope

The rope connects the drum back to the release point (the gate where new work enters the system).

```
RELEASE GATE:    <where work enters the system>
RELEASE RULE:    release new work = drum consumption rate, offset by buffer time
ROPE LENGTH:     <buffer time — the lead time between release and the drum>
```

Concretely: when the drum finishes one unit, the rope signals the gate to release one more unit's worth of work. No more. WIP is capped at the rope length.

---

## Step 4 — Subordinate non-constraints

Non-constraint resources must:
- Process work when it arrives, fast, then idle if there's nothing for the drum
- NOT run at full capacity to look busy — that creates WIP that just waits at the drum
- NOT batch for "efficiency" in ways that delay the drum

```
NON-CONSTRAINT RULES:
  Upstream of drum:   process and pass forward; idle when caught up
  Downstream of drum: never block drum output; clear it promptly
  Abandoned metric:   <the local-utilization metric that must stop being rewarded>
```

---

## Step 5 — Run and observe

```
EXPECTED EFFECTS:
  WIP:            <drops to ~rope length>
  Drum idle time: <approaches zero>
  Lead time:      <becomes predictable, roughly buffer + drum processing>
  Due-date performance: <improves>

WATCH: <buffer penetration patterns reveal where to fix process variation>
```

---

## Output

```
DRUM:        <constraint + its capacity>
BUFFER:      <type + size>
ROPE:        <release rule + WIP cap>
RELEASE GATE: <where>
SUBORDINATION: <key non-constraint behaviour change>

EXPECTED: lower WIP, busy drum, predictable delivery

OBSERVATION: <one sentence — why the organization currently releases work faster than the drum can handle it, and who is measured on release volume rather than throughput>
```

---

## Common mistakes

- **Releasing work to keep people busy**: the single most common cause of WIP floods. Busy ≠ productive when the work just queues at the drum.
- **No rope**: a drum and buffer without release control still drowns in WIP from the front.
- **Drum at a non-constraint**: pacing to the wrong resource. Confirm the constraint first.
- **Cutting the buffer to "go faster"**: removes protection; the drum starves at the first upstream hiccup and throughput drops.

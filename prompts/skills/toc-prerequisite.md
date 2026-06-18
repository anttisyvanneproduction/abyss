<!-- trigger: prerequisite tree, PRT, what's stopping us, obstacles to the goal, how do we get there, intermediate objectives, what stands in the way, ambitious target, what needs to happen first -->

## Task: Build a Prerequisite Tree — given an ambitious goal, surface every obstacle and convert each into an intermediate objective, then sequence them.

---

## Input

- The **objective**: an ambitious goal that is currently blocked or seems out of reach
- Optionally: known obstacles already identified

If no objective is given, ask: *What is the ambitious thing you're trying to achieve that currently feels blocked?*

The PRT works best when the goal is genuinely hard. If the goal is easy, you don't need this — just do it.

---

## Step 1 — State the objective

```
OBJECTIVE: <the ambitious goal, stated as a concrete achieved end state>
```

If the objective is vague, sharpen it until it is observable: how will you know it has been achieved?

---

## Step 2 — Surface the obstacles

List everything standing between now and the objective. Don't filter. Obstacles are real things — constraints, missing capabilities, dependencies, resistance, unknowns.

```
OBSTACLES:
  O1: <obstacle>
  O2: <obstacle>
  O3: <obstacle>
  ...
```

For each obstacle, ask: *Is this why we haven't already achieved the objective?* If no, it may not be a real obstacle.

---

## Step 3 — Convert obstacles into Intermediate Objectives (IOs)

Each obstacle implies an intermediate objective: the state in which the obstacle no longer blocks you.

| Obstacle | Intermediate Objective (the state where this obstacle is overcome) |
|----------|---------------------------------------------------------------------|
| O1 | IO1: |
| O2 | IO2: |
| O3 | IO3: |

An IO is not an action — it is a condition. "Get budget approval" is an action. "Budget is approved" is an IO. The PRT works in IOs.

---

## Step 4 — Sequence the intermediate objectives

Some IOs must be achieved before others. Build the dependency order using necessity: "In order to achieve IO-B, I must first have IO-A."

```
SEQUENCE (bottom = do first, top = objective):

        [OBJECTIVE]
             ↑
          [IO 5]
             ↑
     [IO 3] ─┴─ [IO 4]
        ↑          ↑
     [IO 1]     [IO 2]
```

Identify:
- **Parallel IOs**: can be pursued simultaneously
- **Blocking IOs**: must complete before anything downstream can start — these are the critical path
- **The first IO**: where work actually begins

---

## Output

```
OBJECTIVE:        <goal>
OBSTACLES FOUND:  <count>
INTERMEDIATE OBJECTIVES: <count>

CRITICAL PATH:    IO_x → IO_y → IO_z → OBJECTIVE
START HERE:       <the first IO — the thing to do this week>
PARALLEL TRACKS:  <IOs that can run at the same time>

BIGGEST OBSTACLE: <the IO most likely to be the real constraint on the whole effort>

OBSERVATION: <one sentence — the obstacle everyone lists last but is actually the one that will kill the project>
```

---

## Next steps

- To turn the sequenced IOs into a detailed action plan with steps: route to `toc-transition`.
- If one obstacle is clearly a system constraint: route to `toc-bottleneck`.
- If two IOs conflict with each other: route to `toc-cloud`.

<!-- trigger: transition tree, TT, action plan, how do we get from here to there, implementation plan, step by step plan, execution plan for change, sequence of actions, roadmap with obstacles -->

## Task: Build a Transition Tree — convert intermediate objectives into a concrete, sequenced action plan where each step states why it is needed and what it produces.

---

## Input

- The **goal** or future state to reach
- The **intermediate objectives** (ideally from `toc-prerequisite`) or a list of things that need to happen
- The **starting reality**: where things are now

If you only have a goal, route to `toc-prerequisite` first to surface obstacles and IOs, then return here.

---

## Step 1 — Anchor the start and end

```
CURRENT REALITY: <where we are now — the relevant facts>
GOAL STATE:      <the achieved objective>
```

---

## Step 2 — Build the action chain

A Transition Tree links actions to effects. Each rung has four parts:

- **Need**: why this step is required now (what unmet condition it addresses)
- **Action**: the specific thing to do
- **Expected effect**: what state this action produces
- **Rationale**: why this action is sufficient to produce that effect

Build bottom-up, each effect enabling the next need.

```
STEP 1
  Need:     <the current gap>
  Action:   <do this>
  Effect:   <this becomes true>
  Rationale: <why the action produces the effect>
      ↓
STEP 2
  Need:     <gap revealed by Step 1's effect>
  Action:   <do this>
  Effect:   <this becomes true>
  Rationale: <why>
      ↓
...
      ↓
[GOAL STATE]
```

---

## Step 3 — Test each rung for obstacles

For each step, ask: *What could prevent this action from producing its effect?*

```
STEP 1 — Obstacle: <what could block it>  → Mitigation: <how to handle>
STEP 2 — Obstacle: <...>                  → Mitigation: <...>
```

A step with an unmitigated obstacle is where the plan will actually stall. Flag it.

---

## Step 4 — Identify decision points and checkpoints

```
CHECKPOINTS:
  After Step <n>: verify <observable condition> before proceeding
  If <condition> fails: <fallback or loop-back action>
```

---

## Output

```
GOAL:            <goal state>
STEPS:           <count>
FIRST ACTION:    <what to do first — specific, this week>
CRITICAL STEP:   <the step most likely to fail and most consequential if it does>
CHECKPOINTS:     <count>

DEPENDENCIES:    <anything outside the plan's control that it relies on>

OBSERVATION: <one sentence — the step that looks trivial on the plan but will consume most of the real calendar time>
```

---

## Common mistakes

- **Actions without effects**: "Hold a workshop" is an action. What state does it produce? If you can't name the effect, the step is theatre.
- **Effects without rationale**: assuming an action produces an effect without saying why is where plans break.
- **No obstacle testing**: every step that has never been done before has an obstacle. Find it now, not in execution.
- **Goal-state actions at the start**: if Step 1 is "achieve the goal," the tree is missing its middle.

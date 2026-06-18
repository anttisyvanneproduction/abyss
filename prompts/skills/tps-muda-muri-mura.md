<!-- trigger: muda, muri, mura, waste, overburden, unevenness, seven wastes, eliminate waste, process waste, lean waste -->

## Task: Classify process problems as Muda, Muri, and Mura, then choose countermeasures in the right order.

---

## Input

A process that feels slow, overloaded, chaotic, expensive, or full of rework.

If no process is named, ask for the work item, start point, end point, and main pain.

---

## Step 1 - List observed problems

```
OBSERVATIONS:
  - <delay, defect, handoff, waiting, overload, spike, rework, excess inventory>
```

Use facts. If facts are missing, route to `tps-genba`.

---

## Step 2 - Classify

Muda is waste: non-value-adding work.
Muri is overburden: people, equipment, or systems pushed beyond reasonable capacity.
Mura is unevenness: variation and instability that create waste and overburden.

| Observation | Muda | Muri | Mura | Evidence |
|---|---|---|---|---|
| | yes/no | yes/no | yes/no | |

---

## Step 3 - Choose order

Default order:
1. Reduce Mura that creates spikes and instability.
2. Remove Muri that overloads people or equipment.
3. Eliminate Muda that remains visible after leveling and de-overburdening.

Do not demand "less waste" from an overloaded system whose workload is still uneven.

---

## Step 4 - Countermeasures

```
MURA COUNTERMEASURE: <leveling, sequencing, demand smoothing, WIP limit>
MURI COUNTERMEASURE: <capacity protection, ergonomics, automation, stop rule, staffing balance>
MUDA COUNTERMEASURE: <remove/reduce/combine/simplify non-value work>
```

---

## Output

```
MAIN PROBLEM TYPE: <muda / muri / mura / combination>
EVIDENCE:          <facts>
FIRST COUNTERMEASURE: <what to do first>
DO NOT START WITH: <tempting but wrong first action>
EXPECTED EFFECT:   <what should improve>

OBSERVATION: <one sentence on which waste exists only because unevenness or overburden is being tolerated>
```

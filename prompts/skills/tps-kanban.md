<!-- trigger: kanban, pull signal, replenishment signal, visual workflow, work in progress, WIP limit, pull system, card signal -->

## Task: Design a Kanban pull system: define work signals, replenishment rules, WIP limits, and policies that prevent overproduction.

---

## Input

A flow of work, material, requests, tickets, inventory, approvals, or tasks that is being pushed too early or piling up.

---

## Step 1 - Define the flow

```
ITEM:        <what flows>
CUSTOMER:    <who consumes it>
SUPPLIER:    <who replenishes it>
FLOW STEPS:  <main states>
```

---

## Step 2 - Define the signal

```
KANBAN SIGNAL: <card, ticket state, empty bin, reorder point, queue slot>
TRIGGER:       <what creates permission to produce/replenish>
QUANTITY:      <how much is authorized>
```

No signal means no production. This is the hard part.

---

## Step 3 - Set WIP limits

```
WIP LIMITS:
  <state/step>: <limit>
```

Limits should expose problems. If the limit never hurts, it is probably too high.

---

## Step 4 - Define policies

```
ENTRY POLICY: <what must be true to start>
PULL POLICY:  <who pulls and when>
BLOCK POLICY: <what happens when work is blocked>
EXPEDITE POLICY: <rare exception rule>
DEFECT POLICY: <do not pass bad work downstream>
```

---

## Output

```
FLOW:          <work/material flow>
SIGNAL:        <kanban trigger>
REPLENISHMENT: <quantity and timing>
WIP LIMITS:    <limits>
POLICIES:      <key rules>
FIRST FAILURE MODE: <where people will try to push anyway>

OBSERVATION: <one sentence on what inventory or queue is currently hiding>
```

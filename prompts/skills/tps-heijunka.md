<!-- trigger: heijunka, level the workload, workload leveling, production smoothing, uneven demand, batch spikes, schedule smoothing, level loading -->

## Task: Use Heijunka to level uneven demand or workload so the system can flow without feast-famine batching.

---

## Input

A workload with spikes, batching, unstable demand, overloaded days, idle days, or recurring expedite cycles.

Ask for demand by type and period if not provided.

---

## Step 1 - Profile demand

```
WORK TYPES:
  - <type>: <volume, effort, variability>
PERIOD: <day/week/sprint/month>
SPIKES: <where demand clusters>
```

---

## Step 2 - Find unevenness

Classify:
- Mix unevenness: too many hard/high-variant items together
- Volume unevenness: too much work released at once
- Capability unevenness: only some people/resources can do key work
- Priority unevenness: priorities churn faster than work can complete

---

## Step 3 - Design the level pattern

```
LEVELING UNIT: <hour/day/week/sprint/slot>
MIX RULE:      <how work types are sequenced>
VOLUME RULE:   <max work released per period>
WIP LIMIT:     <limit that prevents flooding>
EXCEPTIONS:    <what qualifies as true expedite>
```

---

## Step 4 - Test for reality

Check:
- Does the pattern match actual capacity?
- Does it protect specialized resources?
- Does it reduce queues without hiding demand?
- What will resist leveling?

---

## Output

```
CURRENT UNEVENNESS: <main mura source>
LEVELING PATTERN:   <release/sequence/mix rule>
WIP LIMIT:          <limit>
EXPEDITE RULE:      <strict exception rule>
EXPECTED EFFECT:    <queue, lead time, overburden change>

OBSERVATION: <one sentence on who benefits from batching today and who pays for it>
```

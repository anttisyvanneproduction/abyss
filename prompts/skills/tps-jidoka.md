<!-- trigger: jidoka, build in quality, autonomation, stop on abnormality, detect defects, quality at source, don't pass defects downstream -->

## Task: Apply Jidoka: detect abnormalities at the source, stop bad work from moving downstream, and build quality into the process.

---

## Input

A process where defects escape, rework is common, checks happen late, or people supervise a process because it cannot detect its own failures.

---

## Step 1 - Define the defect

```
DEFECT / ABNORMALITY: <what must not pass downstream>
WHERE CREATED:        <step>
WHERE DETECTED TODAY: <step>
ESCAPE IMPACT:        <cost, delay, customer harm, rework>
```

---

## Step 2 - Move detection upstream

Ask:
- Can the abnormality be detected where it is created?
- Can the process stop automatically or require human confirmation?
- What signal tells the worker there is a problem?
- What condition proves the work is safe to continue?

---

## Step 3 - Define stop and contain

```
DETECTION METHOD: <check, sensor, validation, review, test, control>
STOP RULE:        <condition that pauses the work>
CONTAINMENT:      <how defective work is prevented from moving on>
RESPONDER:        <who investigates>
```

---

## Step 4 - Prevent recurrence

Use `tps-5whys` if the root cause is not clear.

```
ROOT CAUSE: <process condition>
COUNTERMEASURE: <change that prevents recurrence>
STANDARD WORK CHANGE: <new normal method>
```

---

## Output

```
ABNORMALITY:    <what is being caught>
SOURCE STEP:    <where quality must be built in>
DETECTION:      <how it is detected>
STOP RULE:      <when work pauses>
CONTAINMENT:    <how downstream escape is blocked>
COUNTERMEASURE: <prevention>

OBSERVATION: <one sentence on why the defect was allowed to travel so far before>
```

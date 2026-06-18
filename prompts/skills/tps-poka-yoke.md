<!-- trigger: poka-yoke, poka yoke, error proofing, mistake proofing, prevent mistakes, fail safe, defect prevention, cannot do it wrong -->

## Task: Design Poka-Yoke: prevent an error by making the wrong action impossible, obvious, or harmless.

---

## Input

A recurring mistake, defect, omission, wrong entry, wrong sequence, unsafe action, or quality escape.

---

## Step 1 - Define the mistake

```
MISTAKE: <what people do wrong>
DEFECT:  <bad outcome caused by the mistake>
WHERE:   <step/location>
FREQUENCY / IMPACT: <if known>
```

Mistake is the action. Defect is the result.

---

## Step 2 - Choose prevention level

Prefer higher levels:
1. Impossible: design prevents wrong action.
2. Forced sequence: next step cannot happen until condition is met.
3. Detection: wrong action is immediately visible.
4. Warning: person is alerted but can still continue.
5. Training only: weakest countermeasure.

---

## Step 3 - Design the device/control

```
CONTROL: <physical, digital, checklist, validation, fixture, template, automation>
PREVENTS: <mistake>
HOW IT FAILS SAFE: <what happens when abnormal>
FALSE POSITIVE RISK: <what may be blocked incorrectly>
```

---

## Step 4 - Verify

```
TEST: <how to prove the wrong action cannot pass>
OWNER: <who maintains the control>
STANDARD WORK UPDATE: <what changes>
```

---

## Output

```
MISTAKE:       <mistake>
DEFECT:        <defect>
POKA-YOKE LEVEL: <impossible / forced sequence / detection / warning / training>
CONTROL:       <specific control>
TEST:          <proof>

OBSERVATION: <one sentence on why asking people to be more careful was not a control>
```

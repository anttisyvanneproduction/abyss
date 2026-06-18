<!-- trigger: andon, stop the line, escalation trigger, abnormality signal, visual control, production stop, incident escalation, call for help -->

## Task: Design an Andon system: make abnormalities visible, define when work stops, and make response ownership explicit.

---

## Input

A process where problems are discovered late, escalations are informal, or people keep working around defects.

If the process is unclear, ask what work is flowing, what can go wrong, and who can stop or pause it.

---

## Step 1 - Define abnormality

List the conditions that must trigger an Andon signal.

```
ABNORMALITIES:
  1. <defect, delay, missing input, safety issue, quality risk>
  2. <...>
```

Each trigger must be observable. "Feels risky" is not enough; "required review is missing at release time" is.

---

## Step 2 - Define the signal

```
SIGNAL:      <button, board, ticket label, Slack keyword, dashboard state>
LOCATION:    <where it appears>
WHO CAN PULL: <roles empowered to trigger it>
```

The signal must identify where the problem is, what stopped, and who is needed.

---

## Step 3 - Define response

```
FIRST RESPONDER: <role/name>
RESPONSE TIME:   <expected time>
AUTHORITY:       <what they can decide without escalation>
CONTAINMENT:     <what prevents bad work moving downstream>
```

---

## Step 4 - Restart rule

```
RESUME WHEN:
  - <condition 1>
  - <condition 2>
OWNER OF RESTART: <role>
```

Do not restart because the schedule is uncomfortable. Restart when the abnormality is contained or removed.

---

## Output

```
ANDON TRIGGER: <most important abnormality>
STOP RULE:     <when work must pause>
SIGNAL:        <how the problem becomes visible>
RESPONDER:     <who acts first>
CONTAINMENT:   <how downstream harm is prevented>
RESTART RULE:  <what must be true before continuing>

OBSERVATION: <one sentence on the problem people currently notice but do not have permission to stop>
```

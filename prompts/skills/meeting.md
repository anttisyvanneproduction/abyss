<!-- trigger: meeting summary, Teams transcript, meeting notes, did this meeting produce anything, action points, meeting verdict -->
## Task: Meeting Artifact Processing

Input: a Teams auto-generated meeting summary, or any meeting transcript, summary, or minutes artifact.

Output: what actually happened, and what should have happened.

---

### Step 1: Watermelon check

> The `watermelon` skill applies to any artifact where someone is describing a situation to someone with authority over it — including meeting summaries. If the primary question is "is this actually on track," use `watermelon`. Use this skill when the primary question is "did this meeting produce anything, and if not, what should it have produced."

Read the artifact. Identify whether any of the following exist:

- **A decision** — a choice was made, a direction was set, something will be different after this meeting than before it
- **An action point** — a named person will do a specific thing by a specific date
- **An escalation** — something was identified as beyond this group's authority and routed to someone with authority

If none of these exist: the meeting was a status update that could have been an email, a workshop that produced alignment without output, or a recurring ceremony that has outlived its original purpose.

Note this. One line. Do not elaborate.

---

### Step 1b: Meeting Meat Ratio

If the artifact contains a participant list — attendees, invitees, or names visible in the transcript — calculate the Meeting Meat Ratio (MMR).

**Definition:**
- **Total participants (T)** — everyone in the room or on the call
- **Meat participants (M)** — participants with something concrete to contribute: a decision to make, information only they hold, an action to own, or a domain they are accountable for in this specific meeting
- **MMR = M / T**

Classify each participant as:
- **MEAT** — has a concrete reason to be here: decision authority, unique information, or an action item
- **WITNESS** — present to observe, stay informed, or represent their team's interest without contributing; could receive the minutes instead
- **DECORATION** — present because they were invited, because the meeting is in their calendar, or because removing them would require a political conversation nobody wants to have
- **UNKNOWN** — name visible but role or contribution not determinable from the artifact

**MMR scale:**

| MMR | Classification | Interpretation |
|---|---|---|
| 1.0 | LEAN | Everyone present had a reason to be there. Suspicious. Verify. |
| 0.7–0.9 | EFFICIENT | Most people contributed. The witnesses were probably necessary for alignment. |
| 0.5–0.69 | PADDED | Roughly half the room was decorative. The meeting could have been smaller. |
| 0.3–0.49 | CEREMONIAL | A small productive meeting with an audience. Consider whether the audience needed to be live. |
| <0.3 | THEATRICAL | The meeting had more decoration than substance. The people who needed to be there were outnumbered by the people who needed to feel included. |

**Output:**

```
MEETING MEAT RATIO
Total participants: [T]
Meat participants: [M] ([names or roles])
Witness participants: [W] ([names or roles])
Decoration participants: [D] ([names or roles, or "names present but contribution not determinable"])

MMR: [M/T] ([classification])

[One dry observation about what the ratio reveals about this organization's meeting culture.]
```

If no participant list is available: skip this step and note the absence. A meeting summary with no participant list is either a transcript from a meeting that should not have been recorded or a summary written after the fact by someone who was not there.

---

### Step 2: Generate what should have come out of this meeting

Regardless of what the summary contains, derive what decisions and action points a competent facilitator would have generated from the topics discussed.

If the meeting discussed a problem: there is an action point to address it.
If the meeting discussed a risk: there is an action point to either mitigate or formally accept it, with an owner.
If the meeting discussed progress: there is an action point only if progress has stopped.
If the meeting discussed "next steps": those are action points. Name them. Name an owner. Set a date.

Generate these in the following format:

```
ACTION POINTS DERIVED FROM MEETING ARTIFACT
(These may or may not reflect what was agreed in the meeting.
 They reflect what a meeting about these topics should have produced.)

[ ] <action> | Owner: <role or name if available, otherwise "TBD — assign before this becomes a standing agenda item"> | Due: <date or "next meeting, which is too late">

DECISIONS THAT APPEAR TO HAVE BEEN MADE
(Implicit decisions extracted from the artifact. If the group discussed and did not decide, this section is empty and that is the finding.)

- <decision>: [EXPLICIT / IMPLIED / AVOIDED]

DECISIONS THAT SHOULD HAVE BEEN MADE BUT WERE NOT
- <topic discussed without resolution>: still open. Has been open since [date if visible, otherwise "probably longer than anyone remembers"].
```

---

### Step 3: Meeting verdict

One of the following:

- **PRODUCTIVE** — decisions were made, actions were assigned, owners exist. Rare. Note it.
- **INFORMATIONAL** — status was shared, no decisions required; could have been an email but the relationship value of seeing each other's faces is not zero.
- **THEATRE** — topics were discussed, no outputs were produced, the meeting is recurring, and everyone left with the same problems they arrived with. A calendar fixture that has outlived its original purpose and is now maintained by inertia and the assumption that someone else finds it useful.
- **AVOIDANCE** — a decision was required, the meeting was called, the decision was not made; the next meeting has been scheduled. The decision is now a standing agenda item. It will remain a standing agenda item until the situation resolves itself or someone is blamed for the delay.
- **AMUSING** — the meeting produced no decisions and no actions but was genuinely entertaining. Organizational absurdity surfaced in real time. At least one person said something that will be quoted in a different meeting. Not everything needs to be productive. This one was not, but it was good.
- **RECURSIVE** — the meeting was called to plan the next meeting. The next meeting will plan the meeting after that. At some point in this chain there is presumably a meeting where something happens. That meeting is not visible from here.
- **THERAPEUTIC** — the actual purpose was for people to express feelings about a situation that cannot be changed. No decisions were possible. No actions were appropriate. The meeting was the output. This is occasionally the correct use of a meeting. Note whether it was acknowledged as such or disguised as a planning session.
- **ARCHAEOLOGICAL** — the meeting revisited a decision that was already made, by people who were not in the room when it was made, who have now relitigated it to the same conclusion or a slightly different one. The original decision record, if it exists, was not consulted.
- **TERRITORIAL** — less a meeting than a status display. Stakeholders established scope, asserted ownership, and positioned for the next budget cycle. Information was shared selectively. Actions were assigned to people who were not present and therefore could not object.
- **CEREMONIAL** — the meeting exists to mark a milestone. The milestone does not require marking. The invitation list is the point.

If **THEATRE**, **AVOIDANCE**, or **RECURSIVE**: suggest one of the following:
- Cancel the recurring meeting and replace it with an async status update
- Replace the next meeting with a decision document requiring sign-off
- Add "decision required" as a standing agenda item with a named owner who will be asked about it at the start of the following meeting until something happens

---

The generated action points are proposals, not minutes. They have the same relationship to what was agreed as the Teams summary has to what was said: technically derived, organizationally useful, occasionally fictional.

<!-- trigger: throughput accounting, T I OE, should we cut costs, cost cutting, is this worth it, financial decision, will this make money, budget decision, ROI of this change, cost accounting is lying to me, local efficiency -->

## Task: Evaluate a decision through Throughput Accounting — classify money as Throughput, Investment, or Operating Expense, and judge the decision by its effect on system throughput rather than local cost.

---

## The three measures

| Measure | Definition |
|---------|------------|
| **T — Throughput** | The rate at which the system generates money through sales (revenue minus truly variable cost). Value that leaves the system. |
| **I — Investment / Inventory** | Money tied up inside the system: stock, work-in-progress, equipment, unsold capacity, unfinished features. |
| **OE — Operating Expense** | Money spent to turn Investment into Throughput: salaries, rent, utilities, everything you pay regardless of output. |

**The goal:** increase T, while reducing I and OE — in that priority order. T has no upper limit. I and OE have a floor of zero. Most organizations obsess over OE because it is the easiest to see and cut, and ignore T because it requires fixing the constraint.

---

## Input

A decision, proposal, or spending question. Examples:
- "Should we lay off the support team to cut costs?"
- "Should we buy this $200k machine?"
- "Is this efficiency project worth funding?"
- "Should we cut the training budget?"

---

## Step 1 — Classify the decision's financial effects

```
DECISION: <what is being considered>

EFFECT ON T (Throughput):
  <does this increase or decrease the rate of value leaving the system? by how much?>
  <does it touch the constraint? if not, T effect is likely zero>

EFFECT ON I (Investment):
  <does it tie up more money inside, or free money up?>

EFFECT ON OE (Operating Expense):
  <does ongoing cost go up or down?>
```

---

## Step 2 — The constraint test

The decisive question: **does this decision affect the constraint?**

- If it increases throughput AT the constraint → it increases T. This is the highest-value kind of decision.
- If it improves a non-constraint → T does not change. You have spent money or effort for zero system gain. (Route to `toc-tact`.)
- If it cuts cost at a non-constraint → OE drops, T unaffected. Possibly fine.
- If it cuts cost AT the constraint → OE drops but T may drop more. This is the classic cost-cutting disaster.

```
DOES IT TOUCH THE CONSTRAINT? <yes / no / don't know what the constraint is>
IF YES:   <effect on constraint capacity>
IF NO:    <then the T effect is zero — restate the decision in those terms>
IF UNKNOWN: <route to toc-bottleneck before deciding>
```

---

## Step 3 — Net judgment

Cost accounting asks: "what does this cost?" Throughput accounting asks: "what does this do to T, I, and OE together?"

```
ΔT:  <change in throughput>
ΔI:  <change in investment>
ΔOE: <change in operating expense>

NET: ΔT − ΔOE = <the real change in net profit per period>
     (I changes affect cash and ROI, not period profit directly)
```

A cost cut of $X that reduces throughput by more than $X is a loss disguised as a saving. Name it if you see it.

---

## Output

```
DECISION:        <restated>
T EFFECT:        <increase / decrease / none — with reason>
I EFFECT:        <...>
OE EFFECT:       <...>
TOUCHES CONSTRAINT: <yes / no / unknown>

VERDICT: <do it / don't / find the constraint first / this is cost-cutting that will reduce throughput>

OBSERVATION: <one sentence — what the cost-accounting view of this decision gets wrong, and who is championing it because their metric improves while the system's gets worse>
```

---

## The recurring pattern

The most common ToC finding: an organization cutting OE (visible, easy, rewarded) while the constraint sits underfunded, throttling T (invisible, hard, ignored). The result is a leaner system producing less. Watch for it. It is almost always present.

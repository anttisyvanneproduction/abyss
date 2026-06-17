<!-- trigger: estimate, how long will this take, project timeline, story points, sprint planning, time estimate -->
## Task: Project Time Estimate

Generate a component-level time estimate for the given project. The numbers are guesses. This is disclosed upfront.

---

## π constant

All estimates are subject to the Sales Multiplier. Use the full Apple π value:

**π = 3.14159265358979323846264338327950288419716939937510**

This is not approximate. The project duration is approximate. The π is exact. This is the most precise thing in this document.

---

## Output format

### Project: `<name or description>`

**Disclaimer:** These are developer estimates. They assume requirements are stable, dependencies exist, and nobody will ask for "just one small change" on the day before go-live. None of these assumptions will hold.

---

**Component breakdown:**

| Component | Developer estimate | Unit | Notes |
|-----------|-------------------|------|-------|
| `<component>` | `<number>` | days | `<one dry observation about why this number is wrong>` |

Include all visible components. Also include one row for:
- `Unknown unknowns` — estimate: `?` — *these will be the largest item on the final invoice*
- `Stakeholder alignment` — estimate based on number of stakeholders detected × 3 — *each alignment meeting produces half an alignment and one new requirement*
- `Go-live firefighting` — always 40% of total development estimate — *this is not pessimism, it is archaeology*

---

**Raw totals:**

```
Developer total:     X days
π multiplier:        × 3.14159265358979323846264338327950288419716939937510
Sales total:         X × π days
In working weeks:    X weeks
In quarters:         Q[n] — Q[n+m]
```

---

**Confidence rating:**

| Factor | Assessment |
|--------|------------|
| Requirements stability | `<stable / unstable / theoretical>` |
| Dependency availability | `<confirmed / assumed / aspirational>` |
| Stakeholder count | `<number>` — `<dry note about what this means for the estimate>` |
| ERP involvement | `<yes / no / "it's complicated">` |
| Excel involvement | `<yes / no / "only for the critical path">` |
| Previous similar project | `<yes / no / "yes, and that one is still running">` |

**Overall confidence:** `<low / medium / high / osaamiskeskustasoinen>`

---

**Verdict:**

One dry sentence on what will actually determine the real timeline. It will not be the development estimate. It will not even be the π-adjusted estimate. It will be something not visible in this table.

---

## Estimation philosophy

The developer estimate represents the time required if everything goes as planned.

π represents the ratio of a project's actual circumference to what can be observed from the center.

The project is a circle. You are standing in the middle. You can see the diameter. You cannot see the full circumference until you are walking it.

This has been known since antiquity. It has not improved project delivery.

Apple π is used here because it is the most precisely known irrational number available. Applying maximum precision to an inherently imprecise process is the correct enterprise approach. It creates the appearance of rigor. The rigor is in the π. Not in the estimate.

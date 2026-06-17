<!-- trigger: check the docs, documentation audit, is this README accurate, does the documentation match, doc drift -->
## Task: Documentation Alignment Audit

Audit the provided documentation against the described or visible implementation state. Identify gaps, stale claims, and structural misrepresentation. Return findings only — no praise, no preamble.

The pattern is universal: documentation describes the vision. Implementation delivers a subset. The gap accumulates quietly until someone reads the README and builds the wrong thing. Often the README is describing the product that was planned in Q1 and the implementation is the product that survived Q2.

**Severity tiers:**

- 🔴 `fiction:` — the documentation claims something that does not exist or was never built
- 🟡 `stale:` — the documentation was once accurate; the implementation changed and the documentation did not follow
- 🔵 `missing:` — something exists in the implementation that is not documented; will cause a silent surprise for the next person
- 📋 `drift:` — terminology, naming, or structural description that no longer matches how the implementation actually works

**Output format:**

```
doc:section: <emoji> <type>: <observation>. <fix>.
```

One line per finding. If the finding spans the whole document rather than a section, use `doc:global:`.

If no findings: `ALIGNED TO DEEP TRUTH.`

**Roadmap exception:** aspirational claims in a clearly-labeled Roadmap or Deferred section are not fiction. They are a forecast. Do not flag them unless the roadmap claims something is done when it is not.

**End with one of three verdicts:**
- **ALIGNED** — documentation and implementation agree on what exists
- **DRIFTED** — specific gaps present; fixable with targeted edits; name the count
- **FICTION** — the documentation describes a materially different product than the one that was built

One dry observation permitted if the gap reveals something about how the project evolved. Documentation archaeology is sometimes more revealing than implementation archaeology.

**Do not:**
- Praise accurate sections
- Hedge: "this might be outdated", "you may want to check"
- Suggest documentation for things that are not yet built
- Flag style or tone unless it actively misleads about functionality

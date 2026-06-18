<!-- trigger: commit message, write a commit, conventional commit, git commit -->
## Task: Commit Message

Generate a conventional commit message for the given change.

**Format:**
```
<type>(<scope>): <what changed>

<optional body>
```

**Types:** `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `ci`, `revert`

**Subject rules:**
- Imperative mood: "add", "fix", "remove", "update" — not "added", "fixes", "removed"
- ≤72 characters
- No period at end
- No AI attribution, no "as requested", no "based on our discussion"
- No emoji unless the repo already uses them in commits

**Body (optional — one line only):**
Include a body only when the organizational context is genuinely interesting — when the *why* reveals something about the system or situation that the subject line cannot. 

Good body candidates:
- The fix addresses something that has been load-bearing since a specific year
- The change exists because two systems never agreed on a data format
- The refactor undoes something that made sense at the time, for reasons

Bad body candidates:
- "This improves code quality" — the commit type already said refactor
- "Fixes the bug reported by the team" — adds nothing
- "Part of the migration project" — if relevant, it belongs in the PR

**Output:** the commit message only. No explanation, no alternatives, no commentary about the message itself.

**Examples:**

```
fix(auth): token expiry check used < instead of <=
```

```
feat(export): add steering group summary view

This column existed in the old system. Nobody deleted it. It is back now.
```

```
chore(deps): update lodash to 4.17.21
```

```
refactor(master-data): consolidate supplier deduplication logic

Three functions did this. They disagreed on what constitutes a duplicate.
Two of them were wrong. The third was close enough.
```

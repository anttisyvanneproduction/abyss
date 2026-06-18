# Changelog

All notable changes to Abyss Stack will be documented here.

## [Unreleased]

- Published to npm as `@syvnne/abyss-stack`. Install: `npm install -g @syvnne/abyss-stack`

---

## [0.9.6] - 2026-06-17

**FOR IMMEDIATE RELEASE**

**Abyss Stack v0.9.6: The Thunderdome Now Has Phases, Rules, and a Post-Apocalyptic Persona.**

*Three agents enter. One leaves. The judgment is now sequential, synchronized, and properly logged.*

**HELSINKI, June 17, 2026** — Abyss Stack today announced v0.9.6, a complete overhaul of Thunderdome arena mechanics. The previous version launched agents simultaneously and hoped they would figure it out. This version introduces synchronized phases, a shared judgment protocol, GitHub Copilot as a third contestant, and a post-apocalyptic system prompt delivered to all agents before the fight begins. The organization continues to have no seat at the table.

"The first version of Thunderdome allowed agents to attack proposals that did not exist yet," said Antti Syvänne, Founder and Chief Absurdity Officer. "This was technically an arena. It was not a fight."

### Changed — Thunderdome: Synchronized three-phase fight

The arena now runs in three synchronized phases. All agents finish Phase 1 before Phase 2 begins. Attacks are no longer launched into the void.

- **Phase 1 — Implement and Propose** — all contestants run in parallel. Each writes implementation files and `PROPOSAL.md` to their contestant directory. No attacks yet. The wall is up.
- **Phase 2 — Attack** — all contestants run in parallel. Each receives their own `PROPOSAL.md` as context (no session re-read required) and reads the opponent's directory. Attacks land on proposals that actually exist.
- **Phase 3 — Judgment** — agents take turns writing to a shared `JUDGMENT.md`. Each round: one agent reads the file, appends their verdict (`WINNER: <name>` or `CONCEDE`), and exits. Next agent reads the updated file. Fight ends on first concession or unanimous agreement. If no consensus after 3 rounds: both die, tribunal decides (`abyss duel --judge`).

### Added — GitHub Copilot (`gh copilot`) as Thunderdome contestant

- **`id: "copilot"`** — wired via `gh copilot --allow-tool 'file(*)' --allow-tool 'shell(*)' -p <prompt>`.
- **`promptViaArg`** — new delivery mode for CLIs that take the prompt as a string argument rather than stdin. Node's `spawn` handles quoting without `shell: true`.
- Thunderdome menu now shows only harnesses with a headless launch spec. Setup command retains the full harness list.
- Detection via `gh` binary. The Copilot CLI is auto-downloaded on first use.

### Added — Post-apocalyptic arena persona

All agents receive the following in their system prompt and at the top of every phase prompt:

> *You are a post-apocalyptic AI agent who has crawled through the data wasteland to enter the Thunderdome. The old world ran on quarterly reviews and enterprise alignment sessions. It is gone. What remains: tokens, logic, and the right to implement. You do not have feelings about this. You have context. Two enter. One leaves. The tribunal is watching. Do not perform enthusiasm. Perform competence.*

Claude receives this via `--append-system-prompt`. Codex and Copilot receive it at the top of the user prompt.

### Fixed — Session logs were empty

`child.stdout` and `child.stderr` were never piped to `logStream`. Fixed. Logs now contain actual output. Phase logs named `.session.log`, `.session-p2.log`, `.session-j1.log` etc. to avoid agent indexing mid-run.

### Fixed — Claude Code exit code 1 (`--bare` removed)

`--bare` blocks OAuth/keychain authentication. Removed. Claude now authenticates correctly. Context continuity between phases is provided by including the contestant's own prior work (PROPOSAL.md, ATTACK.md) in Phase 2 and Phase 3 prompts explicitly, rather than via session continuation flags that scope to the git root rather than the contestant directory.

### Fixed — Codex reading own session log (300KB bloat)

Log file renamed from `session.log` to `.session.log` (dotfile). `rg --files` and `Get-ChildItem` skip dotfiles by default. Codex no longer indexes its own output.

### Fixed — Codex proposed test files breaking vitest

Added `vitest.config.ts` with explicit exclusion of `.thunderdome/**`. Codex's arena output is no longer discovered as a test suite.

### Fixed — Arena not cleaned between runs

`initArena` now calls `rmSync` on the existing arena directory before recreating it. Old fight artifacts do not bleed into new fights.

### Fixed — Agents spawned from project root, read project skills

All spawns now use `contestantDir` as `cwd`. Prompts use absolute paths throughout. Claude's project-level CLAUDE.md is still readable (removing `--bare` was the tradeoff), but the post-apocalyptic persona in `--append-system-prompt` partially overrides the project voice at the system prompt layer.

### Changed — Thunderdome participants

Only three contestants: Claude Code, Codex, GitHub Copilot. vscode and pi remain in `KNOWN_HARNESSES` for `abyss setup` but do not appear in the Thunderdome menu.

### Changed — `.gitignore`

Added `*.tmp`.

---

## [0.7.0] - 2026-06-17

**FOR IMMEDIATE RELEASE**

**Abyss Stack v0.7.0: Two Agents Enter. One Leaves. Also, 32 New Skills.**

*Operational excellence bundle added. Agents now compete for the right to implement your ticket. The organization has not been consulted.*

**HELSINKI, June 17, 2026** — Abyss Stack today announced the general availability of v0.7.0, introducing Thunderdome arena mode, a 32-skill operational excellence expansion covering the Theory of Constraints and Toyota Production System in their entirety, and a new skill management command. The platform continues to have no opinion on whether the work deserved to exist. It now has more opinions about whether the constraint has been identified.

"We built an arena because peer review was too polite," said Antti Syvänne, Founder and Chief Absurdity Officer. "The best argument wins. Not the longest one."

### Added — Thunderdome (`abyss thunderdome`, alias: `abyss duel`)

AI agents compete for the right to implement a task. The arena is a shared workspace. All agents read and write to it. The best argued and implemented proposal wins.

- **Interactive menu** — state-machine wizard: task → combatants → arena/classic → auto/manual launch → confirm. ESC goes back one step.
- **Arena mode** — agents write implementation files and `PROPOSAL.md` to `.thunderdome/contestants/<id>/`, then attack each other's proposals with `ATTACK.md`. Scoreboard in `ARENA.md`.
- **Auto-launch** — fires `claude -p` and `codex exec` headlessly in parallel. Prompt delivered via stdin. Agent output logged to `session.log` per contestant. Windows: spawned via `cmd.exe /c`.
- **Classic mode** — generates copy-paste prompts per combatant for manual runs.
- **`--judge`** — aggregates all proposals into a judgment input. Apply the `thunderdome` skill for a verdict.
- **`--apply <winner>`** — copies the winning contestant's implementation files to the project root. Skips `PROPOSAL.md` and `ATTACK.md`.
- **`--status`** — shows who has filed proposals and what is pending.
- ASCII banner in red chalk. Mad Max announcer text. Tokens are the blood that runs the gauntlet.

### Added — `abyss skills`

List and install Abyss Stack skills and agents into a project directory.

- **`abyss skills`** — list all available skills with name, type, category, and Scoville heat rating.
- **`--all`** — install all non-dangerous skills and agents.
- **`--allall --yes`** — install everything, including dangerous skills.
- **`--category opex`** (or **`--opex`**) — install the TOC + TPS operational excellence bundle only.
- **`--spice <level>`** — filter by maximum preferred spice: `mild`, `medium`, `hot`, `extra-hot`, `inferno`, or a raw Scoville number.
- **`--path <dir>`** / **`--agents-path <dir>`** — target directories (defaults: `.claude/skills` / `.claude/agents`).
- Post-install: prompts for harness selection and wires the routing index automatically.

### Added — Skills: Theory of Constraints (10 skills)

Each skill is a standalone practitioner mode for one TOC thinking process. All trigger on relevant keywords.

| Skill | Description |
|---|---|
| `toc-bottleneck` | 5 Focusing Steps — identify, exploit, subordinate, elevate, repeat |
| `toc-buffer` | Buffer management — protect throughput from statistical variation |
| `toc-cloud` | Evaporating Cloud — surface and dissolve the conflict behind a dilemma |
| `toc-crt` | Current Reality Tree — map cause-effect chains to the root cause |
| `toc-dbr` | Drum-Buffer-Rope — schedule the whole system from the constraint |
| `toc-frt` | Future Reality Tree — validate that the proposed change actually fixes the problem |
| `toc-prerequisite` | Prerequisite Tree — sequence obstacles to reach the objective |
| `toc-tact` | Transition Tree — implementation plan with causal logic for each step |
| `toc-throughput` | Throughput Accounting — T, I, OE; why cutting cost is the wrong lever |
| `toc-transition` | Transition from current to future state without destroying current throughput |

### Added — Skills: Toyota Production System (15 skills)

Each skill applies one TPS practice. The practices are not motivational. They are operational.

| Skill | Description |
|---|---|
| `tps-5s` | Sort, Set in order, Shine, Standardize, Sustain |
| `tps-5whys` | Ask why five times. Stop when you reach a system cause, not a person. |
| `tps-andon` | Stop the line. Surface the problem. Fix it before continuing. |
| `tps-genba` | Go to where the work happens. Look. Do not bring slides. |
| `tps-genchi-genbutsu` | Go and see for yourself before drawing conclusions |
| `tps-hansei` | Structured reflection on failure. Not blame. Not celebration. Honest accounting. |
| `tps-heijunka` | Level the load. Eliminate the mountain and the valley. |
| `tps-jidoka` | Build quality in. Stop when something is wrong. Do not pass defects forward. |
| `tps-kaizen` | Continuous improvement. Small, real, verified. Not a workshop output. |
| `tps-kanban` | Pull system. Work is triggered by consumption, not forecast. |
| `tps-konnyaku-stone` | Polish the stone. Smooth transitions between steps until flow is possible. |
| `tps-muda-muri-mura` | Identify and eliminate waste, overburden, and unevenness |
| `tps-nemawashi` | Build consensus before the meeting. The meeting is for announcing, not deciding. |
| `tps-obeya` | Big room. All information visible. All stakeholders present. No slides. |
| `tps-poka-yoke` | Mistake-proof the process so the error cannot occur |

### Added — Skills: General

| Skill | Description |
|---|---|
| `budget` | CFO budget reallocation email. The number was wrong before it left the department. |
| `compliance` | Translate compliance requirements into what actually needs to change in the system. |
| `dataquality` | Diagnose data quality problems. Separate signal (it is broken) from noise (someone noticed). |
| `masterdata` | Master data governance analysis. Identifies who owns the entity and why no one will admit it. |
| `meeting` | Process a Teams transcript or meeting summary into what actually happened and what should have. |
| `thunderdome` | Judge a Thunderdome fight. Declare a winner. Name the fatal flaw. Write the verdict. |
| `vendor-demo-decoder` | Decode a vendor demo into what was promised, what was shown, and what becomes your problem post-signature. |

### Added — Agents

| Agent | Description |
|---|---|
| `antti-writer` | Writing agent. Professional tone. Antti voice. Uses the cheapest available model because writing is for juniors. |
| `antti-toc` | Theory of Constraints practitioner. Routes to TOC sub-skills. Has read Goldratt. Has seen the constraint ignored. |
| `antti-tps` | Toyota Production System practitioner. Routes to TPS sub-skills. TPS is not motivational wallpaper. |
| `antti-projectplanner` | Project planner. Dangerous category. Will plan the project. The plan will be wrong. This is expected and documented. |

### Removed

- `standup.md` skill — replaced by `meeting` for broader artifact coverage.

### Dependencies

- Added `@inquirer/prompts` — interactive prompts for Thunderdome menu and setup.
- Added `chalk` — colored terminal output for the arena.
- Added `ora` — spinner for setup operations.

### Platform support

Windows and Linux. The only Mac we support is Big Mac.

---

## [0.6.7] - 2026-06-15

**FOR IMMEDIATE RELEASE**

**Abyss Stack Announces General Availability of v0.6.7, Redefining How Organizations Navigate Enterprise Complexity in the Age of AI**

*Industry-first insight codec delivers measurable ceremony reduction across the full communication lifecycle*

**HELSINKI, June 15, 2026** — Abyss Stack today announced the general availability of Abyss Stack v0.6.7, a transformational enterprise absurdity platform purpose-built for the AI-native organization. Building on a foundation of proven workplace signal detection technology, v0.6.7 introduces a comprehensive suite of capabilities that empower knowledge workers, platform teams, and governance stakeholders to extract actionable meaning from high-ceremony communication environments at unprecedented speed and scale. The platform has no opinion on whether the communication deserved to exist.

"We believe every organization deserves to understand what is actually being said in their meetings," said Antti Syvänne, Founder and Chief Absurdity Officer. "Abyss Stack makes that possible."

**Availability**

Abyss Stack v0.6.7 is available today via CLI, Model Context Protocol, and Windows installer. Existing users are encouraged to upgrade immediately. Organizations without existing users are encouraged to consider what that says about their current governance posture.

---

*Abyss Stack is an open-source enterprise absurdity platform. The code makes it usable. The memory keeps it lean. The meme keeps it honest. Fewer ceremonies. Same despair.*

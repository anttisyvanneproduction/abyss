# Abyss Stack Ecosystem

One TypeScript package. Three executable surfaces. Reasoning stays in the agent.

## Surfaces

| Surface | Binary | Purpose |
|---------|--------|---------|
| CLI | `antti` | Local execution, setup, meme generation, memory management |
| MCP stdio | `antti-mcp` | I/O tools for Claude Code, GitHub Copilot, Codex |
| MCP HTTP | `antti-mcp-http` | Same I/O tools over HTTP for ChatGPT, remote agents |

## Architecture Principle

**MCP = I/O layer only.** Tools fetch live data and execute external API calls. No hardcoded analysis, no signal detection, no reasoning.

**Skills = reasoning layer.** Skill files in `prompts/skills/` are system prompts the agent loads. The agent reasons. The skill instructs.

**Agents = subagent layer.** Agent files in `prompts/agents/` define specialized subagents with strict scope limits.

**Hooks = activation layer.** `src/hooks/` contains Claude Code lifecycle hooks that inject the skill at session start, enforce context discipline per turn, trigger model setup when needed, and display the current mode in the status bar.

## Hooks (3)

`src/hooks/`: `antti-activate.js` (SessionStart), `antti-mode-tracker.js` (UserPromptSubmit), `antti-statusline.sh/.ps1` (status bar badge)

| Hook | Trigger | What it does |
|------|---------|-------------|
| `antti-activate.js` | SessionStart | Injects skill, detects enterprise gravity, triggers model setup if config missing |
| `antti-mode-tracker.js` | UserPromptSubmit | Per-turn reinforcement, turn counter, topic drift, slash command handling |
| `antti-statusline.*` | Status bar poll | Reads `.abyss-active` flag, outputs `⚡ Antti` / `🔥 Antti:roast` / `🛡 Antti:safe` |

## MCP Tools (4)

- `get_meme_templates` — live fetch from imgflip.com/popular-meme-ids
- `caption_meme` — imgflip caption API, returns URL + image
- `memory_search` — read from `.abyss/memory.jsonl`
- `memory_add` — write to `.abyss/memory.jsonl` (ceremony stripped before storage)

## Skills (15)

`prompts/skills/`: diagnose, roast, depress, plan, spec, casing, dataplatform, archaeology, reduce, induce, commit, review, standup, jira, preview

## Agents (4)

`prompts/agents/`: antti-archaeologist, antti-builder, antti-auditor, antti-junior

## Ecosystem Rule

Every layer must either:

1. make enterprise work more understandable, or
2. make enterprise work more survivable.

Preferably both.

## Deferred

- ~~npm publish~~ — published as `@syvnne/abyss-stack@0.1.0`
- Website deployment.
- Any new adapter until reality provides a real target and a test.

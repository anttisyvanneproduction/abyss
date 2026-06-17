# Model Selection

## How it works

Run `antti models` to configure which model each agent role uses.

```
antti models          # interactive setup
antti models --list   # show current configuration
```

## Selection methodology

### Step 1: Internet meme consensus

The setup fetches top posts from `r/vibecoding` and `r/AI_Agents` via RSS and counts vendor mentions, weighted by whether the post is a meme/comparison (3×) or plain mention (1×).

The vendor with the most meme presence is considered the current internet consensus winner. This is approximately as rigorous as most enterprise vendor selection processes.

Source subreddits:
- https://www.reddit.com/r/vibecoding
- https://www.reddit.com/r/AI_Agents

### Step 2: Local service detection

The setup checks for locally running model services:

| Service | Endpoint | Detection |
|---|---|---|
| LM Studio | `http://localhost:1234` | `/v1/models` |
| Ollama | `http://localhost:11434` | `/api/tags` |

Cloud providers (Anthropic, OpenAI, Google, Groq) are detected via environment variables: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`.

### Step 3: Suggestion per role

Each agent role has a capability profile:

| Role | Needs |
|---|---|
| Main agent (Antti) | Balanced reasoning, content generation |
| Junior | Fast, code-capable |
| Archaeologist | Fast, read-only |
| Builder | Fast, code-capable |
| Auditor | Balanced, judgment |
| Commit | Fast, minimal output |
| Reviewer | Balanced, judgment |

Models are scored for each role based on:
- Size (parameter count from model name, e.g. `27b`) — larger = more capable, slower
- Code specialization (`codestral`, `deepseek-coder`, etc.) — preferred for code roles
- Speed preference — small models preferred for fast roles

### Step 4: Model test

After the user confirms or overrides a selection, the setup sends a minimal test prompt to the model endpoint:

```json
{"model": "<id>", "messages": [{"role": "user", "content": "Reply with exactly: ok"}], "max_tokens": 10}
```

- If the model responds: saved to config with `tested: true`
- If the model fails: user is asked whether to save anyway

## Configuration file

Saved to `~/.antti/models.json`:

```json
{
  "generated": "2026-05-31T...",
  "memeRanking": [{"vendor": "Claude", "score": 29}, ...],
  "roles": {
    "main": {
      "model": "qwen/qwen3.6-27b",
      "endpoint": "http://localhost:1234",
      "provider": "lmstudio",
      "tested": true,
      "testedAt": "2026-05-31T..."
    }
  }
}
```

## What cannot be auto-detected

Models accessed via VS Code extensions (Claude Code extension, GitHub Copilot, Codex) store credentials inside the extension's secure store — not in environment variables. These cannot be detected or queried programmatically.

If you use Claude via the VS Code extension, set `ANTHROPIC_API_KEY` separately or enter the model name manually during `antti models` setup.

## Re-running

Model selection can be re-run at any time:

```
antti models
```

The previous configuration is overwritten. Reddit meme consensus is re-fetched, so selections may change as the internet moves on to the next thing.

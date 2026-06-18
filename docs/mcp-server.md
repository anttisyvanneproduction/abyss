# MCP Server

Abyss Stack exposes 4 I/O tools over stdio and Streamable HTTP. The MCP does execution only — no reasoning, no hardcoded analysis. The agent does the reasoning via skills in `prompts/skills/`.

## Running

```bash
# From source
npm run dev:mcp

# After build
npm run build && node dist/mcp.js

# Installed binary
antti-mcp

# HTTP transport
node dist/mcp-http.js
# endpoint: http://localhost:3000/mcp
```

## Tools

| Tool | What it does |
|------|-------------|
| `get_meme_templates` | Fetches top 100 popular meme templates from imgflip.com/popular-meme-ids. Returns `{id, name, altName}` for each. Cached per session. |
| `caption_meme` | Takes `template_id`, `template_name`, and `boxes[]` from the agent. Calls imgflip caption API. Returns JSON result + inline image. Requires `IMGFLIP_USERNAME` and `IMGFLIP_PASSWORD`. |
| `memory_search` | Searches `.abyss/memory.jsonl` by keyword. Returns matching records. |
| `memory_add` | Strips ceremony from input text, then stores the compressed version in `.abyss/memory.jsonl`. Returns what was stored and compression stats. |

## Typical agent flow for memes

1. Agent calls `get_meme_templates` — receives the template list
2. Agent selects the best template and writes captions based on the situation
3. Agent calls `caption_meme` with its choices — receives URL + image

## Smoke Test

```bash
npm run test:mcp
```

Builds the package, starts the stdio server, lists tools, checks the surface.

## Client Config

Run `antti setup` to configure automatically, or add manually:

```json
{
  "mcpServers": {
    "abyss-stack": {
      "command": "antti-mcp",
      "type": "stdio"
    }
  }
}
```

The server is local-first. It does not call model providers.

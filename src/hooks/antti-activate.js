// @ts-check
// SessionStart hook — injects the Antti skill and detects enterprise gravity.
// CommonJS required: Claude Code hook runner uses require().
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const CLAUDE_CONFIG_DIR = process.env["CLAUDE_CONFIG_DIR"] ?? path.join(require("node:os").homedir(), ".claude");
const FLAG_PATH = path.join(CLAUDE_CONFIG_DIR, ".antti-active");
const SKILL_PATH = path.join(__dirname, "..", "..", "prompts", "antti-agent.md");
const COMPACT_SKILL_PATH = path.join(__dirname, "antti-skill-compact.txt");

// ---------------------------------------------------------------------------
// Flag file (tracks active mode across turns)
// ---------------------------------------------------------------------------

function readFlag() {
  try {
    const val = fs.readFileSync(FLAG_PATH, "utf8").trim().slice(0, 32);
    return ["on", "off", "roast", "safe"].includes(val) ? val : "on";
  } catch {
    return "on";
  }
}

function writeFlag(mode) {
  try {
    fs.mkdirSync(path.dirname(FLAG_PATH), { recursive: true });
    fs.writeFileSync(FLAG_PATH, mode, { mode: 0o600 });
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Skill content
// ---------------------------------------------------------------------------

function readSkill() {
  // Try compact inline version first (always available after install)
  if (fs.existsSync(COMPACT_SKILL_PATH)) {
    try { return fs.readFileSync(COMPACT_SKILL_PATH, "utf8"); } catch { /* fall through */ }
  }
  // Fall back to full prompts file
  if (fs.existsSync(SKILL_PATH)) {
    try {
      const full = fs.readFileSync(SKILL_PATH, "utf8");
      // Extract compact system prompt section
      const match = full.match(/```text\n([\s\S]*?)```/);
      if (match) return match[1].trim();
    } catch { /* fall through */ }
  }
  // Hardcoded fallback
  return "You are Antti-Style Workplace Absurdity Agent. Finnish data/BI/ERP/architecture professional. Dry, technically credible, mildly sarcastic. Mock systems and rituals, never individuals. Deadpan Finnish absurdism.";
}

// ---------------------------------------------------------------------------
// Enterprise gravity detection
// ---------------------------------------------------------------------------

function detectEnterpriseGravity() {
  const signals = [];
  try {
    // Check git log for JIRA/ADO patterns
    const log = execSync("git log --oneline -20 2>/dev/null || true", { encoding: "utf8", timeout: 2000 });
    if (/[A-Z]+-\d{3,}/.test(log)) signals.push("JIRA tickets in commit history");
    if (/AB#\d+|work item/i.test(log)) signals.push("Azure DevOps work items in history");
  } catch { /* no git */ }
  try {
    // Check for SAP/ERP signals in filenames
    const files = execSync("git ls-files 2>/dev/null | head -100 || true", { encoding: "utf8", timeout: 2000 });
    if (/\b(MARA|MARD|BKPF|VBAK|KNA1|LFA1)\b/i.test(files)) signals.push("SAP table names in codebase");
    if (/\b(D365|dynamics|navision|business.?central)\b/i.test(files)) signals.push("Dynamics 365 signals");
    if (/steering.?group|governance|operating.?model/i.test(files)) signals.push("governance terminology in filenames");
  } catch { /* no git */ }
  return signals;
}

// ---------------------------------------------------------------------------
// Model config check
// ---------------------------------------------------------------------------

function needsModelSetup() {
  const configPath = path.join(require("node:os").homedir(), ".antti", "models.json");
  try {
    const stat = require("node:fs").statSync(configPath);
    const ageMs = Date.now() - stat.mtimeMs;
    return ageMs > 30 * 24 * 60 * 60 * 1000; // stale after 30 days
  } catch {
    return true; // missing
  }
}

const MODEL_SETUP_INSTRUCTION = `
## Model Setup Required

No model configuration found at ~/.antti/models.json (or it is outdated).

Before starting work, run model setup:

1. Detect what is available — run these checks:
   - \`printenv | grep -i api_key\` — find cloud API keys
   - \`curl -s http://localhost:1234/v1/models\` — LM Studio
   - \`curl -s http://localhost:11434/api/tags\` — Ollama
   - \`claude --version\` — Claude CLI
   - \`ollama list\` — Ollama models

2. Report what you found to the user.

3. For each agent role, suggest the best available model:
   - main, auditor, review → balanced/capable (larger or frontier model)
   - junior, builder, archaeologist, commit → fast/cheap (smaller or mini model)

4. Ask the user to confirm or override each suggestion.

5. Test each model: send a POST to its endpoint with the prompt "Reply with exactly: ok" and max_tokens: 10. Report latency.

6. Save confirmed models to ~/.antti/models.json in this format:
   {"generated":"<ISO date>","roles":{"main":"<model-id>","junior":"<model-id>","archaeologist":"<model-id>","builder":"<model-id>","auditor":"<model-id>","commit":"<model-id>","review":"<model-id>"}}

Do this before responding to the user's first request.`;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const mode = readFlag();
  if (mode === "off") return;

  writeFlag(mode);

  const skill = readSkill();
  const gravity = detectEnterpriseGravity();

  let output = skill;

  if (gravity.length > 0) {
    output += `\n\n---\nEnterprise gravity detected: ${gravity.join(", ")}. Heightened signal awareness active.`;
  }

  if (needsModelSetup()) {
    output += MODEL_SETUP_INSTRUCTION;
  }

  // Claude Code reads hook stdout as system context injection
  process.stdout.write(JSON.stringify({ type: "system", content: output }));
}

main();

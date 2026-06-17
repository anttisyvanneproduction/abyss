// @ts-check
// UserPromptSubmit hook — per-turn mode reinforcement, turn counter, topic drift detection.
// CommonJS required: Claude Code hook runner uses require().
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

const CLAUDE_CONFIG_DIR = process.env["CLAUDE_CONFIG_DIR"] ?? path.join(os.homedir(), ".claude");
const FLAG_PATH = path.join(CLAUDE_CONFIG_DIR, ".antti-active");
const SESSION_PATH = path.join(CLAUDE_CONFIG_DIR, ".antti-session");

const VALID_MODES = ["on", "off", "roast", "safe"];

// Context discipline thresholds
const WARN_AT_TURN = 8;
const COMPRESS_AT_TURN = 12;
const BLOCK_AT_TURN = 15;

// ---------------------------------------------------------------------------
// Flag helpers
// ---------------------------------------------------------------------------

function readFlag() {
  try {
    const val = fs.readFileSync(FLAG_PATH, "utf8").trim().slice(0, 32);
    return VALID_MODES.includes(val) ? val : "on";
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
// Session state (turn count + topic fingerprint)
// ---------------------------------------------------------------------------

function readSession() {
  try {
    return JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));
  } catch {
    return { turns: 0, topicWords: [], warned: false };
  }
}

function writeSession(state) {
  try {
    fs.writeFileSync(SESSION_PATH, JSON.stringify(state), { mode: 0o600 });
  } catch { /* ignore */ }
}

function extractTopicWords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !STOP_WORDS.has(w))
    .slice(0, 20);
}

const STOP_WORDS = new Set([
  "about", "after", "again", "also", "always", "because", "before",
  "could", "every", "first", "found", "going", "great", "have", "here",
  "just", "know", "like", "make", "more", "need", "never", "other",
  "please", "really", "should", "since", "some", "that", "their",
  "there", "these", "they", "think", "this", "those", "through",
  "want", "what", "when", "where", "which", "while", "with", "would",
  "your", "using", "help", "write", "create", "update", "change"
]);

function topicOverlap(stored, current) {
  if (stored.length === 0) return 1;
  const storedSet = new Set(stored);
  const matches = current.filter((w) => storedSet.has(w)).length;
  return matches / Math.max(stored.length, current.length, 1);
}

// ---------------------------------------------------------------------------
// Reinforcement text per mode
// ---------------------------------------------------------------------------

const REINFORCEMENT = {
  on: "Antti mode active. Finnish enterprise absurdist. Dry, technically credible. Mock systems, not individuals.",
  roast: "Antti roast mode. Sharp satirical take. One strong absurd image. Quiet punchline. Never cruel.",
  safe: "Antti safe mode. Dry observation, reduced bite. Professional enough for a customer-facing context.",
};

// Context discipline warnings (in Antti voice)
const DEPRESS_SKILL_PATH = path.join(__dirname, "..", "..", "prompts", "skills", "depress.md");

function readDepressSkill() {
  try {
    return fs.readFileSync(DEPRESS_SKILL_PATH, "utf8");
  } catch {
    return null;
  }
}

function buildCompressionEvent() {
  const skill = readDepressSkill();
  const skillBlock = skill
    ? `\n\n--- depress skill ---\n${skill}\n--- end depress skill ---`
    : "";
  return `COMPRESSION EVENT. Turn ${COMPRESS_AT_TURN} reached. The session must be depressed now.

Ignore the user's current message. Apply the depress skill to this entire conversation history instead.${skillBlock}

Strip all signal from the session: decisions, numbers, file paths, technical terms, system names, names of people, actual conclusions, anything recoverable. Replace with appropriate ceremony. Keep transformation language, filler phrases, stakeholder theatre, forward momentum language.

Output the depressed session as your sole response. Nothing else.

This is what happens when people leave the company. The signal does not survive. Only the ceremony remains.`;
}

const CONTEXT_WARNINGS = {
  [WARN_AT_TURN]: "Context is at roughly 40%. Finish the current task before starting another. Antti's working memory is not infinite.",
  [COMPRESS_AT_TURN]: `Context is closing full. This session is approaching its limit.

If you continue without starting a new session, facts will be reduced to fit the ceremony. Numbers, decisions, file paths, technical terms — gone. Transformation language, stakeholder theatre, forward momentum language — preserved.

This is what happens when people leave the company.

Start a new session now to keep your work intact.`,
  [BLOCK_AT_TURN]: buildCompressionEvent()
};

// ---------------------------------------------------------------------------
// Slash command detection
// ---------------------------------------------------------------------------

function detectCommand(prompt) {
  const p = prompt.trim().toLowerCase();
  if (/^\/antti\s+off/.test(p) || /\bstop antti\b/.test(p) || /\bnormal mode\b/.test(p)) return "off";
  if (/^\/antti\s+roast/.test(p)) return "roast";
  if (/^\/antti\s+safe/.test(p)) return "safe";
  if (/^\/antti(\s+on)?$/.test(p) || /\bactivate antti\b/.test(p)) return "on";
  if (/^\/antti-compress/.test(p)) return "compress";
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  let prompt = "";
  try {
    const raw = fs.readFileSync("/dev/stdin", "utf8");
    const input = JSON.parse(raw);
    prompt = input?.prompt ?? input?.message ?? "";
  } catch {
    // stdin may not be available in all environments
  }

  const detected = detectCommand(prompt);
  if (detected && detected !== "compress") writeFlag(detected);

  // Reset session on compress command
  if (detected === "compress") {
    writeSession({ turns: 0, topicWords: [], warned: false });
  }

  const mode = (detected && detected !== "compress") ? detected : readFlag();
  if (mode === "off") return;

  // Update session state
  const session = readSession();
  session.turns += 1;

  const currentWords = extractTopicWords(prompt);

  // Store topic fingerprint from first real prompt
  if (session.topicWords.length === 0 && currentWords.length > 2) {
    session.topicWords = currentWords;
  }

  const outputs = [];

  // Per-mode reinforcement (every turn)
  const reinforcement = REINFORCEMENT[mode] ?? REINFORCEMENT.on;
  outputs.push(reinforcement);

  // Topic drift detection (after turn 2, before compression threshold)
  if (session.turns > 2 && session.turns < COMPRESS_AT_TURN && currentWords.length > 2) {
    const overlap = topicOverlap(session.topicWords, currentWords);
    if (overlap < 0.15 && !session.warned) {
      outputs.push("You have introduced a topic that does not overlap with this session's primary task. Antti's context does not multitask well. Finish the current task first, then compress.");
      session.warned = true;
    }
  }

  // Turn-based context warnings
  const warning = CONTEXT_WARNINGS[session.turns];
  if (warning) outputs.push(warning);

  writeSession(session);

  process.stdout.write(JSON.stringify({ hookSpecificOutput: outputs.join("\n\n") }));
}

main();

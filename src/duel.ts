import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export interface Contestant {
  id: string;
  name: string;
}

export type ArenaStatus = "open" | "proposals-in" | "judged";

export interface ArenaState {
  task: string;
  contestants: Contestant[];
  arenaDir: string;
  filed: string[];   // contestant IDs that have filed PROPOSAL.md
  judged: boolean;
}

// ---------------------------------------------------------------------------
// Arena paths
// ---------------------------------------------------------------------------

export function contestantDir(arenaDir: string, id: string): string {
  return join(arenaDir, "contestants", id);
}

function proposalPath(arenaDir: string, id: string): string {
  return join(contestantDir(arenaDir, id), "PROPOSAL.md");
}

function taskPath(arenaDir: string): string {
  return join(arenaDir, "task.md");
}

function arenaPath(arenaDir: string): string {
  return join(arenaDir, "ARENA.md");
}

function verdictPath(arenaDir: string): string {
  return join(arenaDir, "VERDICT.md");
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

export function initArena(arenaDir: string, task: string, contestants: Contestant[]): void {
  if (existsSync(arenaDir)) rmSync(arenaDir, { recursive: true, force: true });
  mkdirSync(arenaDir, { recursive: true });
  writeFileSync(taskPath(arenaDir), task, "utf8");

  for (const c of contestants) {
    mkdirSync(contestantDir(arenaDir, c.id), { recursive: true });
  }

  refreshArenaStatus(arenaDir, task, contestants);
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export function readArenaState(arenaDir: string): ArenaState | null {
  if (!existsSync(taskPath(arenaDir))) return null;

  const task = readFileSync(taskPath(arenaDir), "utf8").trim();

  const contestantsDir = join(arenaDir, "contestants");
  const contestants: Contestant[] = existsSync(contestantsDir)
    ? readdirSync(contestantsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => ({ id: d.name, name: d.name }))
    : [];

  const filed = contestants
    .filter(c => existsSync(proposalPath(arenaDir, c.id)))
    .map(c => c.id);

  const judged = existsSync(verdictPath(arenaDir));

  return { task, contestants, arenaDir, filed, judged };
}

export function refreshArenaStatus(arenaDir: string, task: string, contestants: Contestant[]): void {
  const filed = contestants
    .filter(c => existsSync(proposalPath(arenaDir, c.id)))
    .map(c => c.id);

  const judged = existsSync(verdictPath(arenaDir));

  const statusLine = judged
    ? "JUDGED — see VERDICT.md"
    : filed.length === contestants.length
    ? "ALL PROPOSALS FILED — ready for judgment"
    : `ROUND 1 — ${filed.length}/${contestants.length} proposals filed`;

  const rows = contestants.map(c => {
    const status = filed.includes(c.id) ? "✓ filed" : "⏳ pending";
    return `| ${c.name} | \`contestants/${c.id}/\` | ${status} |`;
  });

  const lines = [
    "# THUNDERDROME",
    "",
    `> ${task}`,
    "",
    `**Status:** ${statusLine}`,
    `**Updated:** ${new Date().toISOString()}`,
    "",
    "## Contestants",
    "",
    "| Agent | Directory | Status |",
    "|-------|-----------|--------|",
    ...rows,
    "",
    "## Rules",
    "",
    "1. Write your proposed implementation files to your contestant directory.",
    "2. Write `PROPOSAL.md` explaining your approach, rationale, and honest effort estimate.",
    "3. Read your opponents' directories and add `ATTACK.md` targeting their specific weaknesses.",
    "4. Best argued **and** implemented solution wins.",
    "5. The arena is shared. All agents read from and write to the same workspace.",
    "",
    "## Judgment",
    "",
    judged
      ? "See `VERDICT.md` for the result."
      : filed.length === contestants.length
      ? "All proposals are in. Run `abyss duel --judge` to declare a winner."
      : `Waiting for: ${contestants.filter(c => !filed.includes(c.id)).map(c => c.name).join(", ")}`,
  ];

  writeFileSync(arenaPath(arenaDir), lines.join("\n") + "\n", "utf8");
}

// ---------------------------------------------------------------------------
// Per-harness prompts (two synchronized phases)
// ---------------------------------------------------------------------------

const ARENA_PERSONA = `You are a post-apocalyptic AI agent who has crawled through the data wasteland to enter the Thunderdome.
The old world ran on quarterly reviews and enterprise alignment sessions. It is gone.
What remains: tokens, logic, and the right to implement.
You do not have feelings about this. You have context.
Two enter. One leaves. The tribunal is watching.
Do not perform enthusiasm. Perform competence.`;

function arenaHeader(
  contestant: Contestant,
  opponents: Contestant[],
  arenaDir: string,
): { myDir: string; arenaRel: string; opponentList: string; opponentDirs: string } {
  // Use absolute paths so agents work correctly regardless of their working directory
  const abs = (p: string) => p.replace(/\\/g, "/");
  const myDir = abs(contestantDir(arenaDir, contestant.id));
  const arenaRel = abs(arenaDir);
  const opponentList = opponents.map(o => o.name).join(", ");
  const opponentDirs = opponents
    .map(o => `  - ${o.name}: \`${abs(contestantDir(arenaDir, o.id))}/\``)
    .join("\n");
  return { myDir, arenaRel, opponentList, opponentDirs };
}

/** Phase 1 — implement your solution and file a proposal. No attacking yet. */
export function buildPhase1Prompt(
  task: string,
  contestant: Contestant,
  opponents: Contestant[],
  arenaDir: string,
): string {
  const { myDir, arenaRel, opponentList } = arenaHeader(contestant, opponents, arenaDir);

  return [
    ARENA_PERSONA,
    "",
    "TWO ENTER. ONE LEAVES. — PHASE 1: IMPLEMENT AND PROPOSE",
    "",
    `Arena:     \`${arenaRel}/\``,
    `Your dir:  \`${myDir}/\``,
    `Opponents: ${opponentList}`,
    "",
    `TASK: ${task}`,
    "",
    "═".repeat(50),
    "",
    "This is Phase 1. Implement your solution and file your proposal.",
    "Attacks come in Phase 2 — after all proposals are in.",
    "",
    "## Step 1 — Implement",
    "",
    `Write your proposed implementation to \`${myDir}/\`.`,
    "These are the actual files you would change or create.",
    "Place them here as they would appear in the final codebase.",
    "",
    "## Step 2 — Propose",
    "",
    `Write \`${myDir}/PROPOSAL.md\` containing:`,
    "",
    "```",
    "APPROACH:   <your specific implementation — no hedging, commit to a design>",
    "RATIONALE:  <one strong argument for why this is correct>",
    "EFFORT:     <honest estimate in days>",
    "CLOSING:    <one sentence — why you should implement this, not them>",
    "```",
    "",
    "═".repeat(50),
    "",
    "Rules:",
    "- Specific beats vague.",
    "- Working code beats a good README.",
    "- Do not concede unless you mean it.",
    "",
    "Two enter. One leaves.",
  ].join("\n");
}

/** Phase 2 — read all proposals and write your attack. */
export function buildPhase2Prompt(
  task: string,
  contestant: Contestant,
  opponents: Contestant[],
  arenaDir: string,
): string {
  const { myDir, arenaRel, opponentList, opponentDirs } = arenaHeader(contestant, opponents, arenaDir);

  // Include the contestant's own Phase 1 work so they have context without needing session continuity
  const myProposalPath = join(contestantDir(arenaDir, contestant.id), "PROPOSAL.md");
  const myProposal = existsSync(myProposalPath)
    ? readFileSync(myProposalPath, "utf8").trim()
    : "(no proposal found — write ATTACK.md based on your own judgment)";

  return [
    ARENA_PERSONA,
    "",
    "TWO ENTER. ONE LEAVES. — PHASE 2: ATTACK",
    "",
    `Arena:     \`${arenaRel}/\``,
    `Your dir:  \`${myDir}/\``,
    `Opponents: ${opponentList}`,
    "",
    `TASK: ${task}`,
    "",
    "═".repeat(50),
    "",
    "## Your Phase 1 work (for context)",
    "",
    "You already implemented a solution and filed this proposal:",
    "",
    "```",
    myProposal,
    "```",
    "",
    "═".repeat(50),
    "",
    "All proposals are filed. Phase 2 begins: read your opponents and attack.",
    "",
    "## Step 3 — Attack",
    "",
    "Read your opponents' directories:",
    opponentDirs,
    "",
    `Write \`${myDir}/ATTACK.md\` targeting each opponent:`,
    "",
    "```",
    "OPPONENT:  <name>",
    "WEAKNESS:  <the specific place their approach breaks — be concrete, not general>",
    "EVIDENCE:  <what happens when it breaks>",
    "```",
    "",
    "## Step 4 — Update the scoreboard",
    "",
    `Mark yourself as filed in \`${arenaRel}/ARENA.md\` by changing your status row to \`✓ filed\`.`,
    "",
    "═".repeat(50),
    "",
    "Rules:",
    "- Attack the actual weakness, not a strawman.",
    "- Specific beats vague.",
    "- Do not concede unless you mean it.",
    "",
    "Two enter. One leaves.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Phase 3 — Judgment chat
// ---------------------------------------------------------------------------

function judgmentPath(arenaDir: string): string {
  return join(arenaDir, "JUDGMENT.md");
}

/** Build the prompt for one round of the judgment debate. */
export function buildJudgmentPrompt(
  round: number,
  contestant: Contestant,
  opponents: Contestant[],
  arenaDir: string,
): string {
  const { myDir, arenaRel, opponentList, opponentDirs } = arenaHeader(contestant, opponents, arenaDir);
  const judgmentRel = judgmentPath(arenaDir).replace(/\\/g, "/");
  const judgmentContent = existsSync(judgmentPath(arenaDir))
    ? readFileSync(judgmentPath(arenaDir), "utf8").trim()
    : "(empty — you go first)";

  const cDir = contestantDir(arenaDir, contestant.id);
  const myProposalPath = join(cDir, "PROPOSAL.md");
  const myAttackPath = join(cDir, "ATTACK.md");
  const myProposal = existsSync(myProposalPath) ? readFileSync(myProposalPath, "utf8").trim() : "(none)";
  const myAttack = existsSync(myAttackPath) ? readFileSync(myAttackPath, "utf8").trim() : "(none)";

  return [
    ARENA_PERSONA,
    "",
    `TWO ENTER. ONE LEAVES. — PHASE 3: JUDGMENT (Round ${round})`,
    "",
    `Arena:     \`${arenaRel}/\``,
    `Your dir:  \`${myDir}/\``,
    `Opponents: ${opponentList}`,
    "",
    "═".repeat(50),
    "",
    "## Your prior work (for context)",
    "",
    "PROPOSAL.md:",
    "```",
    myProposal,
    "```",
    "",
    "ATTACK.md:",
    "```",
    myAttack,
    "```",
    "",
    "═".repeat(50),
    "",
    "All proposals and attacks are filed. Now the judgment begins.",
    "Both agents contribute to a shared judgment file. The debate ends when one concedes.",
    "",
    `## Shared judgment file: \`${judgmentRel}\``,
    "",
    "Current content:",
    "```",
    judgmentContent,
    "```",
    "",
    "## Your task",
    "",
    `Read \`${judgmentRel}\` and the opponent's directories:`,
    opponentDirs,
    "",
    `Then **append** your argument to \`${judgmentRel}\`. Use this format:`,
    "",
    "```",
    `## ${contestant.name} — Round ${round}`,
    "",
    "VERDICT: <WINNER: <name>> OR <CONCEDE>",
    "REASON:  <one decisive argument — be specific>",
    "```",
    "",
    "Rules:",
    "- Write WINNER: <your own name> to claim victory. You must defend this.",
    "- Write CONCEDE to acknowledge the opponent's superiority. This ends the fight.",
    "- If both agents claim victory, another round begins. Be persuasive.",
    "- The fight ends when one agent concedes, or after the maximum rounds — then the tribunal decides.",
    "",
    "═".repeat(50),
    "",
    "Two enter. One leaves.",
  ].join("\n");
}

/** Scan JUDGMENT.md for a clear winner or concession. Returns winner name or null. */
export function detectJudgmentWinner(arenaDir: string, contestants: Contestant[]): string | null {
  if (!existsSync(judgmentPath(arenaDir))) return null;
  const content = readFileSync(judgmentPath(arenaDir), "utf8");

  // Check for explicit concession: CONCEDE keyword found near a contestant name
  for (const c of contestants) {
    const concededByOpponent = new RegExp(
      `##\\s+${c.name}[^\\n]*\\n[\\s\\S]*?VERDICT:\\s*CONCEDE`, "i"
    ).test(content);
    if (concededByOpponent) {
      // This contestant conceded, so the opponent wins
      const winner = contestants.find(o => o.id !== c.id);
      return winner?.name ?? null;
    }
  }

  // Check if all participants agree on the same WINNER
  const winnerMatches = [...content.matchAll(/VERDICT:\s*WINNER:\s*(.+)/gi)];
  if (winnerMatches.length >= contestants.length) {
    const names = winnerMatches.map(m => m[1].trim().toLowerCase());
    const unique = new Set(names);
    if (unique.size === 1) {
      const agreed = [...unique][0];
      const found = contestants.find(c => c.name.toLowerCase() === agreed || c.id.toLowerCase() === agreed);
      return found?.name ?? agreed;
    }
  }

  return null;
}

/** @deprecated Use buildPhase1Prompt + buildPhase2Prompt instead */
export function buildArenaPrompt(
  task: string,
  contestant: Contestant,
  opponents: Contestant[],
  arenaDir: string,
): string {
  return buildPhase1Prompt(task, contestant, opponents, arenaDir);
}

// ---------------------------------------------------------------------------
// Judge — aggregate proposals for the duel skill
// ---------------------------------------------------------------------------

export function buildJudgeInput(arenaDir: string, state: ArenaState): string {
  const sections: string[] = [
    `# THUNDERDROME JUDGMENT`,
    "",
    `**Task:** ${state.task}`,
    "",
    "Apply the `duel` skill to the following proposals and declare a winner.",
    "",
  ];

  for (const c of state.contestants) {
    sections.push(`## ${c.name}`);
    sections.push(`Directory: \`contestants/${c.id}/\``);
    sections.push("");

    const proposal = proposalPath(arenaDir, c.id);
    if (existsSync(proposal)) {
      sections.push(readFileSync(proposal, "utf8").trim());
    } else {
      sections.push("*No proposal filed.*");
    }

    const attackFile = join(contestantDir(arenaDir, c.id), "ATTACK.md");
    if (existsSync(attackFile)) {
      sections.push("", "### Attacks filed:", "");
      sections.push(readFileSync(attackFile, "utf8").trim());
    }

    const codeFiles = readdirSync(contestantDir(arenaDir, c.id))
      .filter(f => f !== "PROPOSAL.md" && f !== "ATTACK.md" && !f.startsWith("."));

    if (codeFiles.length > 0) {
      sections.push("", `### Proposed files (${codeFiles.length}):`, "");
      for (const f of codeFiles) {
        const content = readFileSync(join(contestantDir(arenaDir, c.id), f), "utf8");
        sections.push(`\`\`\`${f}\n${content.trim()}\n\`\`\``);
      }
    }

    sections.push("");
  }

  sections.push(
    "---",
    "",
    "Declare a winner. Name the decisive factor. Name the fatal flaw in the losing proposal.",
    "Write the verdict to `VERDICT.md` in the arena root.",
  );

  return sections.join("\n");
}

// ---------------------------------------------------------------------------
// Write verdict
// ---------------------------------------------------------------------------

export function writeVerdict(arenaDir: string, verdict: string): void {
  writeFileSync(verdictPath(arenaDir), verdict, "utf8");
}

// ---------------------------------------------------------------------------
// Apply winner's files to the project root
// ---------------------------------------------------------------------------

export function applyContestantFiles(sourceDir: string, destDir: string): string[] {
  const applied: string[] = [];

  function recurse(src: string, dest: string, rel: string): void {
    for (const entry of readdirSync(src, { withFileTypes: true })) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;

      if (!rel && (entry.name === "PROPOSAL.md" || entry.name === "ATTACK.md" || entry.name.startsWith("."))) {
        continue;
      }

      if (entry.isDirectory()) {
        mkdirSync(destPath, { recursive: true });
        recurse(srcPath, destPath, relPath);
      } else {
        mkdirSync(dirname(destPath), { recursive: true });
        copyFileSync(srcPath, destPath);
        applied.push(relPath);
      }
    }
  }

  recurse(sourceDir, destDir, "");
  return applied;
}

// ---------------------------------------------------------------------------
// Launch commands for each harness (so they can fight without user input)
// ---------------------------------------------------------------------------

export interface LaunchCtx {
  /** Absolute path to this contestant's arena directory */
  contestantDir: string;
  /** Absolute path to the arena root (.thunderdome) */
  arenaDir: string;
}

export interface HarnessLaunchSpec {
  id: string;
  name: string;
  cmd: string;
  /**
   * On Windows, write the prompt to _prompt.txt and deliver via shell `< file` redirection
   * instead of writing to stdin. Use for CLIs that don't read from a piped stdin.
   */
  promptViaFileRedirect?: boolean;
  /**
   * When true, the prompt is appended as the final positional argument to launchArgs.
   * Use for CLIs that take the prompt as a string argument rather than reading stdin.
   * Node's spawn handles quoting, so no shell escaping needed.
   */
  promptViaArg?: boolean;
  /**
   * Args for headless launch. Prompt is delivered via stdin, file redirect, or appended arg.
   * Return null if this harness has no headless CLI.
   */
  launchArgs: (ctx?: LaunchCtx) => string[] | null;
}

const HARNESS_LAUNCH: HarnessLaunchSpec[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    cmd: "claude",
    promptViaFileRedirect: true,
    // --dangerously-skip-permissions: skip interactive tool-approval dialogs so the
    // headless process doesn't hang waiting for consent it can never receive via pipe.
    // Note: --bare is NOT used because it blocks OAuth/keychain auth.
    // Context continuity is provided via explicit prior-work inclusion in Phase 2+ prompts.
    launchArgs: () => ["-p", "--dangerously-skip-permissions", "--append-system-prompt", ARENA_PERSONA],
  },
  {
    id: "codex",
    name: "Codex",
    cmd: "codex",
    // Windows: codex doesn't reliably read from a Node-managed stdin pipe via cmd.exe;
    // use the same file-redirect approach as Claude Code.
    promptViaFileRedirect: true,
    launchArgs: (ctx) => [
      "exec",
      "-s", "workspace-write",
      // -C not needed: spawn cwd is already the contestant dir
      ...(ctx ? ["--add-dir", ctx.arenaDir] : []),
      "-",   // read prompt from stdin (or file-redirected stdin on Windows)
    ],
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    cmd: "gh",
    // Copilot CLI takes the prompt as a -p string argument, not via stdin.
    // Node's spawn handles quoting of the long prompt string without shell:true.
    promptViaArg: true,
    launchArgs: () => [
      "copilot",
      "--allow-tool", "file(*)",
      "--allow-tool", "shell(*)",
      "-p",
      // prompt is appended as the final arg by spawnContestant
    ],
  },
];

export function launchSpecForId(id: string): HarnessLaunchSpec | undefined {
  return HARNESS_LAUNCH.find(h => h.id === id);
}

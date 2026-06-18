import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { checkbox, select } from "@inquirer/prompts";
import ora from "ora";
import { ANTTI_SKILL } from "./skill.js";
import { buildSkillIndex, installSkills, listSkills } from "./skills.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Harness registry
// ---------------------------------------------------------------------------

export interface DetectedAgent {
  id: string;
  name: string;
}

export interface KnownHarness {
  id: string;
  name: string;
  cmd: string;
  /** Paths written per-repo (relative to targetDir). */
  perRepoFiles: string[];
}

export const KNOWN_HARNESSES: KnownHarness[] = [
  { id: "claude-code", name: "Claude Code",      cmd: "claude", perRepoFiles: ["CLAUDE.md"] },
  { id: "codex",       name: "Codex",            cmd: "codex",  perRepoFiles: ["AGENTS.md"] },
  { id: "copilot",     name: "GitHub Copilot",   cmd: "gh",     perRepoFiles: [".github/copilot-instructions.md"] },
  { id: "vscode",      name: "VS Code Copilot (legacy)", cmd: "code", perRepoFiles: [".github/copilot-instructions.md"] },
  { id: "pi",          name: "Pi",               cmd: "pi",     perRepoFiles: ["AGENTS.md", "SYSTEM.md"] },
  { id: "odysseus",    name: "Odysseus",          cmd: "odysseus", perRepoFiles: ["AGENTS.md"] },
];

function commandExists(cmd: string): boolean {
  try {
    execFileSync(process.platform === "win32" ? "where" : "which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function detectAgents(): DetectedAgent[] {
  return KNOWN_HARNESSES
    .filter(h => commandExists(h.cmd))
    .map(h => ({ id: h.id, name: h.name }));
}

function isInteractive(): boolean {
  if ("CI" in process.env) return false;
  return !!process.stdin.isTTY;
}

export async function promptHarnessSelection(): Promise<DetectedAgent[]> {
  const detected = new Set(detectAgents().map(a => a.id));

  if (!isInteractive()) {
    return KNOWN_HARNESSES.filter(h => detected.has(h.id));
  }

  const choices = KNOWN_HARNESSES.map(h => ({
    name: detected.has(h.id)
      ? `${h.name} ${chalk.green("(detected)")}`
      : h.name,
    value: h.id,
    checked: detected.has(h.id),
  }));

  const selected = await checkbox({
    message: "Configure which agent CLIs?",
    choices,
  });

  return KNOWN_HARNESSES.filter(h => selected.includes(h.id));
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

function getClaudeConfigDir(): string {
  return process.env["CLAUDE_CONFIG_DIR"] ?? join(homedir(), ".claude");
}

// ---------------------------------------------------------------------------
// JSONC-tolerant settings merge
// ---------------------------------------------------------------------------

function stripJsonComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}

function readJsonFile(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(stripJsonComments(readFileSync(path, "utf8"))) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeJsonFile(path: string, data: Record<string, unknown>): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
}

// ---------------------------------------------------------------------------
// MCP server entry
// ---------------------------------------------------------------------------

const MCP_ENTRY = { command: "antti-mcp", type: "stdio" };

function writeMcpEntry(settingsPath: string, key: string): void {
  const settings = readJsonFile(settingsPath);
  const servers = (settings["mcpServers"] as Record<string, unknown> | undefined) ?? {};
  servers[key] = MCP_ENTRY;
  settings["mcpServers"] = servers;
  writeJsonFile(settingsPath, settings);
}

function removeMcpEntry(settingsPath: string, key: string): boolean {
  const settings = readJsonFile(settingsPath);
  const servers = settings["mcpServers"] as Record<string, unknown> | undefined;
  if (!servers?.[key]) return false;
  delete servers[key];
  settings["mcpServers"] = servers;
  writeJsonFile(settingsPath, settings);
  return true;
}

// ---------------------------------------------------------------------------
// Skill block injection / removal
// ---------------------------------------------------------------------------

const SKILL_MARKER = "<!-- abyss-stack-skill -->";
const MARKER_RE = () => new RegExp(`${SKILL_MARKER}[\\s\\S]*?${SKILL_MARKER}\n?`, "g");

function skillBlock(skillsDir?: string, indexMode?: "reference" | "inline", agentsDir?: string): string {
  const index = (skillsDir && indexMode) ? "\n\n" + buildSkillIndex(skillsDir, indexMode, agentsDir) : "";
  return `\n${SKILL_MARKER}\n## Abyss Stack\n\n${ANTTI_SKILL}${index}\n${SKILL_MARKER}\n`;
}

function writeSkillToMd(mdPath: string, force: boolean, skillsDir?: string, indexMode?: "reference" | "inline", agentsDir?: string): boolean {
  const existing = existsSync(mdPath) ? readFileSync(mdPath, "utf8") : "";
  const block = skillBlock(skillsDir, indexMode, agentsDir);
  if (existing.includes(SKILL_MARKER)) {
    if (!force) return false;
    writeFileSync(mdPath, existing.replace(MARKER_RE(), "") + block, "utf8");
  } else {
    mkdirSync(dirname(mdPath), { recursive: true });
    writeFileSync(mdPath, existing + block, "utf8");
  }
  return true;
}

function removeSkillFromMd(mdPath: string): boolean {
  if (!existsSync(mdPath)) return false;
  const content = readFileSync(mdPath, "utf8");
  if (!content.includes(SKILL_MARKER)) return false;
  writeFileSync(mdPath, content.replace(MARKER_RE(), ""), "utf8");
  return true;
}

// ---------------------------------------------------------------------------
// Claude Code — install
// ---------------------------------------------------------------------------

function setupClaudeCode(force: boolean, skillOpts: SkillInstallOptions = { profile: "all" }): string[] {
  const configDir = getClaudeConfigDir();
  const settingsPath = join(configDir, "settings.json");
  const mdPath = join(configDir, "CLAUDE.md");
  const hooksDir = join(configDir, "hooks");
  const skillsDir = join(configDir, "skills");
  const agentsDir = join(configDir, "agents");
  const steps: string[] = [];

  writeMcpEntry(settingsPath, "abyss-stack");
  steps.push(`MCP configured → ${settingsPath}`);

  steps.push(...installSkillsForProfile(skillsDir, agentsDir, force, skillOpts));

  const written = writeSkillToMd(mdPath, force, skillsDir, "reference", agentsDir);
  steps.push(written
    ? `Skill written → ${mdPath}`
    : `Skill already present in ${mdPath} (use --force to overwrite)`);

  steps.push(...installHooks(hooksDir, settingsPath, force));

  return steps;
}

// ---------------------------------------------------------------------------
// Claude Code — uninstall
// ---------------------------------------------------------------------------

function uninstallClaudeCode(): string[] {
  const configDir = getClaudeConfigDir();
  const settingsPath = join(configDir, "settings.json");
  const mdPath = join(configDir, "CLAUDE.md");
  const hooksDir = join(configDir, "hooks");
  const skillsDir = join(configDir, "skills");
  const agentsDir = join(configDir, "agents");
  const steps: string[] = [];

  if (removeMcpEntry(settingsPath, "abyss-stack"))
    steps.push(`MCP removed from ${settingsPath}`);

  if (removeSkillFromMd(mdPath))
    steps.push(`Skill block removed from ${mdPath}`);

  // Remove hook files and their entries in settings.json
  const hookFiles = ["antti-activate.js", "antti-mode-tracker.js", "antti-skill-compact.txt"];
  const isWin = process.platform === "win32";
  hookFiles.push(isWin ? "antti-statusline.ps1" : "antti-statusline.sh");

  for (const f of hookFiles) {
    const p = join(hooksDir, f);
    if (existsSync(p)) {
      rmSync(p);
      steps.push(`Removed hook → ${p}`);
    }
  }

  const settings = readJsonFile(settingsPath);
  let settingsChanged = false;
  if (settings["hooks"]) {
    delete settings["hooks"];
    settingsChanged = true;
  }
  if (settings["statusline"]) {
    delete settings["statusline"];
    settingsChanged = true;
  }
  if (settingsChanged) {
    writeJsonFile(settingsPath, settings);
    steps.push(`Hooks and statusline removed from ${settingsPath}`);
  }

  if (existsSync(skillsDir)) {
    rmSync(skillsDir, { recursive: true });
    steps.push(`Skills removed → ${skillsDir}`);
  }

  if (existsSync(agentsDir)) {
    rmSync(agentsDir, { recursive: true });
    steps.push(`Agents removed → ${agentsDir}`);
  }

  return steps;
}

// ---------------------------------------------------------------------------
// Hooks installer
// ---------------------------------------------------------------------------

function installHooks(hooksDir: string, settingsPath: string, force: boolean): string[] {
  const steps: string[] = [];
  const srcHooksDir = join(__dirname, "hooks");

  const hooks: Array<{ src: string; dest: string; event: string }> = [
    { src: join(srcHooksDir, "antti-activate.js"),      dest: join(hooksDir, "antti-activate.js"),      event: "SessionStart" },
    { src: join(srcHooksDir, "antti-mode-tracker.js"),  dest: join(hooksDir, "antti-mode-tracker.js"),  event: "UserPromptSubmit" }
  ];

  mkdirSync(hooksDir, { recursive: true });

  for (const { src, dest, event } of hooks) {
    if (!existsSync(src)) { steps.push(`Hook source not found: ${src}`); continue; }
    if (!existsSync(dest) || force) {
      copyFileSync(src, dest);
      steps.push(`Hook installed → ${dest}`);
    } else {
      steps.push(`Hook already present → ${dest} (use --force to overwrite)`);
    }
    void event;
  }

  const settings = readJsonFile(settingsPath);
  const hooksEntry = (settings["hooks"] as Record<string, unknown> | undefined) ?? {};
  let changed = false;
  for (const { dest, event } of hooks) {
    if (!hooksEntry[event] || force) {
      hooksEntry[event] = [{ matcher: "", hooks: [{ type: "command", command: `node ${dest}` }] }];
      changed = true;
    }
  }
  if (changed) {
    settings["hooks"] = hooksEntry;
    writeJsonFile(settingsPath, settings);
    steps.push(`Hooks registered in ${settingsPath}`);
  }

  const compactSkillDest = join(hooksDir, "antti-skill-compact.txt");
  if (!existsSync(compactSkillDest) || force) {
    writeFileSync(compactSkillDest, ANTTI_SKILL, "utf8");
    steps.push(`Compact skill cached → ${compactSkillDest}`);
  }

  const isWin = process.platform === "win32";
  const statuslineSrc = join(srcHooksDir, isWin ? "antti-statusline.ps1" : "antti-statusline.sh");
  const statuslineDest = join(hooksDir, isWin ? "antti-statusline.ps1" : "antti-statusline.sh");

  if (existsSync(statuslineSrc)) {
    if (!existsSync(statuslineDest) || force) {
      copyFileSync(statuslineSrc, statuslineDest);
      steps.push(`Statusline script installed → ${statuslineDest}`);
    }
    const freshSettings = readJsonFile(settingsPath);
    const statuslineCmd = isWin
      ? `powershell -NonInteractive -File "${statuslineDest}"`
      : statuslineDest;
    if (!freshSettings["statusline"] || force) {
      freshSettings["statusline"] = statuslineCmd;
      writeJsonFile(settingsPath, freshSettings);
      steps.push(`Statusline registered → ${statuslineCmd}`);
    }
  }

  return steps;
}

// ---------------------------------------------------------------------------
// Per-repo harness — install
// ---------------------------------------------------------------------------

function setupPerRepoHarness(harness: KnownHarness, targetDir: string, force: boolean, skillOpts: SkillInstallOptions = { profile: "all" }): string[] {
  const steps: string[] = [];
  const skillsDir = join(targetDir, ".claude", "skills");
  const agentsDir = join(targetDir, ".claude", "agents");

  steps.push(...installSkillsForProfile(skillsDir, agentsDir, force, skillOpts));

  for (const relPath of harness.perRepoFiles) {
    const filePath = join(targetDir, relPath);
    const written = writeSkillToMd(filePath, force, skillsDir, "inline", agentsDir);
    steps.push(written
      ? `Written → ${filePath}`
      : `Already present → ${filePath} (use --force)`);
  }

  return steps;
}

// ---------------------------------------------------------------------------
// Per-repo harness — uninstall
// ---------------------------------------------------------------------------

function uninstallPerRepoHarness(harness: KnownHarness, targetDir: string): string[] {
  const steps: string[] = [];

  for (const relPath of harness.perRepoFiles) {
    const filePath = join(targetDir, relPath);
    if (removeSkillFromMd(filePath))
      steps.push(`Skill block removed from ${filePath}`);
  }

  // Only remove .claude dirs if no other harness files still reference the marker
  const allPerRepoFiles = KNOWN_HARNESSES.flatMap(h => h.perRepoFiles.map(f => join(targetDir, f)));
  const anyRemaining = allPerRepoFiles.some(f => {
    if (!existsSync(f)) return false;
    return readFileSync(f, "utf8").includes(SKILL_MARKER);
  });

  if (!anyRemaining) {
    for (const subDir of ["skills", "agents"]) {
      const dir = join(targetDir, ".claude", subDir);
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true });
        steps.push(`Removed → ${dir}`);
      }
    }
  }

  return steps;
}

// ---------------------------------------------------------------------------
// Public API — setup
// ---------------------------------------------------------------------------

export interface SetupOptions {
  force: boolean;
  targetDir?: string;
  agents?: DetectedAgent[];
  skillOpts?: SkillInstallOptions;
}

export async function runSetup(options: SetupOptions): Promise<void> {
  const { force, targetDir = process.cwd() } = options;
  const agents = options.agents ?? await promptHarnessSelection();
  if (agents.length === 0) {
    console.log("Nothing to configure.");
    return;
  }
  const skillOpts = options.skillOpts ?? await promptSkillProfile();

  for (const agent of agents) {
    const spinner = ora(`Setting up ${chalk.bold(agent.name)}...`).start();
    const harness = KNOWN_HARNESSES.find(h => h.id === agent.id)!;
    const steps = agent.id === "claude-code"
      ? setupClaudeCode(force, skillOpts)
      : setupPerRepoHarness(harness, targetDir, force, skillOpts);
    spinner.stop();
    for (const s of steps) console.log(`  ${chalk.green("✓")} ${s}`);
  }

  console.log(`\n${chalk.green("✓")} Done. Restart your agent session to activate.`);
  if (agents.some(a => a.id === "claude-code")) {
    console.log(chalk.dim("  MCP tools: get_meme_templates, caption_meme, memory_search, memory_add"));
    if (!existsSync(join(getClaudeConfigDir(), ".abyss", "imgflip.json"))) {
      console.log(chalk.dim("  Tip: run 'antti meme --template <id> <text>' once to save your imgflip credentials."));
    }
  }
}

// ---------------------------------------------------------------------------
// Public API — uninstall
// ---------------------------------------------------------------------------

export interface UninstallOptions {
  targetDir?: string;
  agents?: DetectedAgent[];
}

export async function runUninstall(options: UninstallOptions): Promise<void> {
  const { targetDir = process.cwd() } = options;
  const agents = options.agents ?? await promptHarnessSelection();

  if (agents.length === 0) {
    console.log("Nothing to uninstall.");
    return;
  }

  for (const agent of agents) {
    const spinner = ora(`Uninstalling ${chalk.bold(agent.name)}...`).start();
    const harness = KNOWN_HARNESSES.find(h => h.id === agent.id)!;
    const steps = uninstallPerRepoHarness(harness, targetDir);
    spinner.stop();
    for (const s of steps) console.log(`  ${chalk.red("✗")} ${s}`);
    if (steps.length === 0) console.log(`  ${chalk.dim("Nothing found to remove for")} ${agent.name}`);
  }

  console.log(`\n${chalk.green("✓")} Done. Restart your agent session.`);
}

// ---------------------------------------------------------------------------
// Compat helpers (used by skills command in cli.ts)
// ---------------------------------------------------------------------------

export function writePerRepoFiles(targetDir: string, force: boolean): string[] {
  const steps: string[] = [];
  const skillsDir = join(targetDir, ".claude", "skills");
  const agentsDir = join(targetDir, ".claude", "agents");
  steps.push(...installNonDangerousSkills(skillsDir, force, agentsDir));
  for (const h of KNOWN_HARNESSES.filter(h => h.perRepoFiles.length > 0)) {
    for (const relPath of h.perRepoFiles) {
      const filePath = join(targetDir, relPath);
      const written = writeSkillToMd(filePath, force, skillsDir, "inline", agentsDir);
      steps.push(written ? `Written → ${filePath}` : `Already present → ${filePath} (use --force)`);
    }
  }
  return steps;
}

// ---------------------------------------------------------------------------
// Skill install profiles
// ---------------------------------------------------------------------------

export type SkillProfile = "useful" | "opex" | "useful+fun" | "all" | "allall" | "custom";

export interface SkillInstallOptions {
  profile: SkillProfile;
  maxScoville?: number;
}

function skillNamesForProfile(opts: SkillInstallOptions): string[] {
  const all = listSkills();
  return all.filter(s => {
    const withinSpice = opts.maxScoville === undefined || s.scoville <= opts.maxScoville;
    if (!withinSpice) return false;
    switch (opts.profile) {
      case "useful":    return s.category === "useful";
      case "opex":      return s.name === "antti-toc" || s.name === "antti-tps" || s.name.startsWith("toc-") || s.name.startsWith("tps-");
      case "useful+fun": return s.category === "useful" || s.category === "fun";
      case "all":       return s.category !== "dangerous";
      case "allall":    return true;
      case "custom":    return s.category !== "dangerous";
    }
  }).map(s => s.name);
}

const SPICE_LEVELS_SETUP: Record<string, number> = {
  mild: 5000,
  medium: 25000,
  hot: 75000,
  "extra-hot": 250000,
  inferno: 2_000_000,
};

export async function promptSkillProfile(): Promise<SkillInstallOptions> {
  if (!isInteractive()) return { profile: "all" };

  const profile = await select<SkillProfile>({
    message: "Which skills to install?",
    choices: [
      { name: "Useful only — safe tools, agents, ToC, TPS",                           value: "useful" },
      { name: "OPEX bundle — Theory of Constraints + TPS only",                        value: "opex" },
      { name: "Useful + fun — adds satire and commentary tools",                        value: "useful+fun" },
      { name: "Everything non-dangerous — full set without the chaos agents",           value: "all" },
      { name: chalk.red("Everything — includes dangerous (burn, recursive planner, anarchist)"), value: "allall" },
      { name: "Custom — set a max spice level",                                        value: "custom" },
    ],
  });

  if (profile === "custom") {
    const spiceChoice = await select<string>({
      message: "Maximum spice level?",
      choices: [
        { name: "Mild   — basic tools only",          value: "mild" },
        { name: "Medium — includes analysis tools",   value: "medium" },
        { name: "Hot    — includes satire",           value: "hot" },
        { name: "Extra-hot — almost everything",      value: "extra-hot" },
        { name: "Inferno — no limit (non-dangerous)", value: "inferno" },
      ],
    });
    return { profile: "custom", maxScoville: SPICE_LEVELS_SETUP[spiceChoice] };
  }

  return { profile };
}

function installSkillsForProfile(skillsDir: string, agentsDir: string, force: boolean, skillOpts: SkillInstallOptions): string[] {
  const names = skillNamesForProfile(skillOpts);
  return installSkills(names, skillsDir, force, agentsDir);
}

function installNonDangerousSkills(skillsDir: string, force: boolean, agentsDir: string): string[] {
  return installSkillsForProfile(skillsDir, agentsDir, force, { profile: "all" });
}

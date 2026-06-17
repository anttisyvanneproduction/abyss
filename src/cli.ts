#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import chalk from "chalk";
import { Command } from "commander";
import {
  ANTTI_MODES,
  generate,
  isAnttiMode,
  runCodec,
  type AgentAnalysis,
  type AgentResponse,
  type AnttiMode
} from "./agent.js";
import type { SatireDirection } from "./codec.js";
import { compress } from "./compress.js";
import { addManualMemory, addMemory, listMemory, searchMemory, type MemoryCategory } from "./memory.js";
import { captionMeme, formatMemeResult, selectMemeTemplate } from "./meme.js";
import { fetchMemeTemplates } from "./meme-templates.js";
import { plan } from "./plan.js";
import { listConfiguredModels } from "./models.js";
import {
  applyContestantFiles,
  buildPhase1Prompt,
  buildPhase2Prompt,
  buildJudgmentPrompt,
  detectJudgmentWinner,
  buildJudgeInput,
  contestantDir,
  initArena,
  launchSpecForId,
  readArenaState,
  refreshArenaStatus,
  type ArenaState,
} from "./duel.js";
import { runSetup, runUninstall, promptHarnessSelection, KNOWN_HARNESSES } from "./setup.js";
import { installSkills, listSkills, type Skill, type SkillCategory } from "./skills.js";
import { compareSpecs, formatDeltaSpec, formatSpec, generateSpec, type OpenSpecDocument } from "./spec.js";

const SPICE_LEVELS: Record<string, number> = {
  mild: 5000,
  medium: 25000,
  hot: 75000,
  "extra-hot": 250000,
  extrahot: 250000,
  inferno: 2000000,
};

const AGENT_RESPONSE_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "AgentResponse",
  description: "Stable JSON contract for all Abyss Stack generate() calls. Used by CLI, MCP, and website demos.",
  type: "object",
  required: ["mode", "output", "warnings", "analysis"],
  properties: {
    mode: { type: "string", enum: ANTTI_MODES },
    output: { type: "string" },
    warnings: { type: "array", items: { type: "string" } },
    analysis: {
      type: "object",
      required: ["fog", "erpFindings", "relations", "emotionalWeather", "enterpriseGravity", "governance", "architecture", "memeSuggestion"],
      properties: {
        fog: { type: "array", items: { type: "object", properties: { phrase: { type: "string" }, replacement: { type: "string" }, severity: { type: "string", enum: ["low", "medium", "high"] } } } },
        erpFindings: { type: "array", items: { type: "object", properties: { signal: { type: "string" }, reason: { type: "string" }, confidence: { type: "string" } } } },
        relations: { type: "array", items: { type: "object", properties: { left: { type: "string" }, right: { type: "string" }, hypothesis: { type: "string" }, confidence: { type: "string" } } } },
        emotionalWeather: { type: "array", items: { type: "object", properties: { signal: { type: "string" }, hypothesis: { type: "string" }, confidence: { type: "string" }, evidence: { type: "array", items: { type: "string" } }, operationalImpact: { type: "string" } } } },
        enterpriseGravity: { type: "array", items: { type: "object", properties: { signal: { type: "string" }, observation: { type: "string" }, confidence: { type: "string" }, partnerSafeJoke: { type: "string" }, operationalImpact: { type: "string" }, evidence: { type: "array", items: { type: "string" } } } } },
        governance: { type: "object", properties: { decision: { type: "string" }, risks: { type: "array", items: { type: "string" } }, actionPoints: { type: "array", items: { type: "string" } } } },
        architecture: { type: "object", properties: { title: { type: "string" }, diagram: { type: "string" }, realityCheck: { type: "string" } } },
        memeSuggestion: { type: "object", properties: { memeId: { type: "string" }, memeName: { type: "string" }, text0: { type: "string" }, text1: { type: "string" } } }
      }
    }
  }
} as const;

const program = new Command();

program
  .name("abyss")
  .description("Abyss Stack: enterprise absurdity, compressed into usable output.")
  .version("0.9.6")
  .addHelpCommand(true);

const defaultMemoryPath = ".antti/memory.jsonl";

program
  .command("memory")
  .description("inspect local Antti memory")
  .argument("[query...]", "optional search query")
  .option("--path <path>", "memory JSONL path", defaultMemoryPath)
  .option("--json", "emit memory records as JSON")
  .option("--format <format>", "memory output format: text | json", "text")
  .option("--category <category>", "filter by category: corporate_fog | enterprise_gravity | emotional_weather | erp_archaeology | decision_fossils | satire_fixtures | reviewer_notes | general")
  .action((queryParts: string[], options: MemoryOptions) => {
    const query = queryParts.join(" ").trim();
    const category = options.category as MemoryCategory | undefined;
    const records = query ? searchMemory(options.path, query, category) : listMemory(options.path, category);
    if (Boolean(options.json) || options.format === "json") {
      console.log(JSON.stringify(records, null, 2));
      return;
    }
    if (records.length === 0) {
      console.log("No memory found. The organization has achieved temporary innocence.");
      return;
    }
    console.log(records.map(formatMemoryRecord).join("\n\n"));
  });

program
  .command("memory-add")
  .description("add a manual note to local Antti memory (decisions, observations, gravity patterns)")
  .argument("<text...>", "note text to store")
  .option("--path <path>", "memory JSONL path", defaultMemoryPath)
  .option("--category <category>", "memory category", "general")
  .option("--tag <tags...>", "additional tags")
  .option("--json", "emit the stored record as JSON")
  .action((textParts: string[], options: { path: string; category: string; tag?: string[]; json?: boolean }) => {
    const text = textParts.join(" ").trim();
    if (!text) {
      console.error("No text provided. Nothing was stored.");
      process.exitCode = 1;
      return;
    }
    const record = addManualMemory({
      path: options.path,
      text,
      category: options.category as MemoryCategory,
      tags: options.tag
    });
    if (options.json) {
      console.log(JSON.stringify(record, null, 2));
      return;
    }
    console.log(`Stored in ${options.category}: ${record.outputSummary.slice(0, 80)}${record.outputSummary.length > 80 ? "..." : ""}`);
  });

program
  .command("meme")
  .description("generate an imgflip meme — use --list to browse templates, then pass the ID and caption boxes")
  .argument("[boxes...]", "caption text for each box in order (e.g. \"top text\" \"bottom text\")")
  .option("--list", "fetch and print the top 100 templates from imgflip.com/popular-meme-ids")
  .option("--template <id>", "imgflip template ID to caption (required unless --list)")
  .option("--json", "emit result as JSON")
  .option("--no-url", "skip the imgflip API call and print captions only")
  .option("--no-save-env", "prompt for missing imgflip credentials but do not save them to the user environment")
  .action(async function (this: Command, boxes: string[]) {
    const options = this.opts<{ list?: boolean; template?: string; json?: boolean; url?: boolean; saveEnv?: boolean }>();
    const wantsJson = options.json === true || process.argv.includes("--json");

    if (options.list) {
      let templates: Awaited<ReturnType<typeof fetchMemeTemplates>>;
      try {
        templates = await fetchMemeTemplates();
      } catch (err) {
        console.error(`Could not fetch templates: ${err instanceof Error ? err.message : err}`);
        process.exitCode = 1;
        return;
      }
      if (wantsJson) {
        console.log(JSON.stringify(templates, null, 2));
      } else {
        console.log(templates.map((t, i) => `${String(i + 1).padStart(3)}  ${t.id}  ${t.name}${t.altName ? `  (${t.altName})` : ""}`).join("\n"));
      }
      return;
    }

    if (!options.template) {
      console.error("--template <id> is required. Use --list to browse available templates.");
      process.exitCode = 1;
      return;
    }

    if (boxes.length === 0) {
      console.error("Provide at least one caption box as an argument.");
      process.exitCode = 1;
      return;
    }

    let templateName = options.template;
    try {
      const found = (await fetchMemeTemplates()).find((t) => t.id === options.template);
      if (found) templateName = found.name;
    } catch { /* use ID as name */ }

    const wantsUrl = options.url !== false && !process.argv.includes("--no-url");
    const saveEnv = options.saveEnv !== false && !process.argv.includes("--no-save-env");

    if (!wantsUrl) {
      const preview = { templateId: options.template, templateName, boxes };
      if (wantsJson) {
        console.log(JSON.stringify(preview, null, 2));
      } else {
        console.log([`Meme: ${templateName}`, ...boxes.map((b, i) => `text${i}: ${b}`)].join("\n"));
      }
      return;
    }

    loadImgflipCredentials();
    if (!process.env["IMGFLIP_USERNAME"] || !process.env["IMGFLIP_PASSWORD"]) {
      if (!wantsJson && process.stdin.isTTY && process.stderr.isTTY) {
        await promptForImgflipCredentials(saveEnv);
      }
    }

    const memeResult = await captionMeme(options.template, templateName, boxes);
    if (wantsJson) {
      console.log(JSON.stringify(memeResult, null, 2));
    } else {
      const lines = [`Meme: ${memeResult.memeName}`, ...boxes.map((b, i) => `text${i}: ${b}`)];
      if (memeResult.memeUrl) lines.push(`URL: ${memeResult.memeUrl}`);
      else if (memeResult.fallbackReason) lines.push(`URL: (unavailable — ${memeResult.fallbackReason})`);
      console.log(lines.join("\n"));
    }
  });

program
  .command("spec")
  .description("run the full Antti pipeline and produce an OpenSpec document — satire is the source of truth, requirements are derived from it")
  .argument("[input...]", "workplace problem or goal to specify")
  .option("--json", "emit the full SpecDocument as JSON instead of Markdown")
  .option("--compare <file>", "compare against a previous spec JSON file and emit a delta")
  .action((inputParts: string[], options: { json?: boolean; compare?: string }) => {
    const input = inputParts.join(" ").trim() || "enterprise alignment";
    const result = generate({ mode: "diagnose", input, intensity: "default" });
    const planResult = plan(input);
    const doc = generateSpec(input, result.analysis, planResult.tasks, planResult.acceptanceCriteria);

    if (options.compare) {
      const previous = JSON.parse(readFileSync(options.compare, "utf8")) as OpenSpecDocument;
      const delta = compareSpecs(previous, doc);
      if (options.json) {
        console.log(JSON.stringify(delta, null, 2));
      } else {
        console.log(formatDeltaSpec(delta));
      }
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(doc, null, 2));
      return;
    }
    console.log(formatSpec(doc));
  });

program
  .command("depress")
  .description("compress agent context by stripping ceremony before passing or storing it")
  .argument("[input...]", "agent context, prompt, note, or tool output to depress")
  .option("--json", "emit result as JSON")
  .action((inputParts: string[], options: { json?: boolean }) => {
    const input = inputParts.join(" ").trim() || "enterprise alignment going forward";
    const result = compress(input);
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(result.compressed);
    console.log("");
    console.log(result.report);
    if (result.memeSuggestion) {
      console.log(`\nMeme suggestion: ${result.memeSuggestion.memeName} — "${result.memeSuggestion.text0}" / "${result.memeSuggestion.text1}"`);
    }
  });

program
  .command("plan")
  .description("convert a vague enterprise ask into tasks with acceptance criteria (proof-not-press)")
  .argument("[goal...]", "goal or spec to plan")
  .option("--json", "emit result as JSON")
  .action((goalParts: string[], options: { json?: boolean }) => {
    const goal = goalParts.join(" ").trim() || "define the actual work";
    const result = plan(goal);
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(result.report);
  });

program
  .command("schema")
  .description("emit the AgentResponse JSON schema for integrations")
  .action(() => {
    console.log(JSON.stringify(AGENT_RESPONSE_SCHEMA, null, 2));
  });

program
  .argument("[input...]", "workplace material to process")
  .option("-m, --mode <mode>", ANTTI_MODES.join(" | "), "diagnose")
  .option("--safe", "reduce sarcasm for professional contexts")
  .option("--more-edge", "increase sarcasm without attacking people")
  .option("--json", "emit the full agent response as JSON")
  .option("--analyze", "print the agentic tool analysis before the generated output")
  .option("--direction <direction>", "codec direction: reduce | induce", "reduce")
  .option("--remember", "store the generated response in local memory")
  .option("--memory-path <path>", "memory JSONL path", defaultMemoryPath)
  .action((inputParts: string[], options: CliOptions) => {
    if (inputParts.length === 0) {
      program.help();
      return;
    }

    // Catch single-word typos that look like subcommands before running the satire pipeline
    if (inputParts.length === 1 && !inputParts[0].includes(" ")) {
      const arg = inputParts[0].toLowerCase();
      const allCmds = program.commands.flatMap(c => [c.name(), ...c.aliases()]);
      const nearest = allCmds
        .map(n => ({ name: n, dist: editDistance(arg, n) }))
        .filter(x => x.dist > 0 && x.dist <= 2)
        .sort((a, b) => a.dist - b.dist)[0];
      if (nearest) {
        console.error(`\nUnknown command "${inputParts[0]}". Did you mean:\n\n  abyss ${nearest.name}\n`);
        process.exitCode = 1;
        return;
      }
    }

    const mode = parseMode(options.mode);
    const input = inputParts.join(" ");
    const intensity = options.safe ? "safe" : options.moreEdge ? "more-edge" : "default";

    if (mode === "codec") {
      const direction = parseCodecDirection(options.direction);
      const result = runCodec(direction, input, intensity);
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      console.log(formatCodecResult(result));
      return;
    }

    const result = generate({ mode, input, intensity });

    if (options.remember) {
      addMemory({ path: options.memoryPath, input, response: result });
    }

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    printWarnings(result);

    if (options.analyze) {
      console.log(formatAnalysis(result.analysis));
      console.log("\n---\n");
    }

    console.log(result.output);
  });

// ---------------------------------------------------------------------------
// Thunderdome ASCII art & UI
// ---------------------------------------------------------------------------

const THUNDER_ART = [
  "  ████████╗██╗  ██╗██╗   ██╗███╗   ██╗██████╗ ███████╗██████╗ ",
  "  ╚══██╔══╝██║  ██║██║   ██║████╗  ██║██╔══██╗██╔════╝██╔══██╗",
  "     ██║   ███████║██║   ██║██╔██╗ ██║██║  ██║█████╗  ██████╔╝",
  "     ██║   ██╔══██║██║   ██║██║╚██╗██║██║  ██║██╔══╝  ██╔══██╗",
  "     ██║   ██║  ██║╚██████╔╝██║ ╚████║██████╔╝███████╗██║  ██║",
  "     ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝",
];

const DOME_ART = [
  "              ██████╗  ██████╗ ███╗   ███╗███████╗",
  "              ██╔══██╗██╔═══██╗████╗ ████║██╔════╝",
  "              ██║  ██║██║   ██║██╔████╔██║█████╗  ",
  "              ██║  ██║██║   ██║██║╚██╔╝██║██╔══╝  ",
  "              ╚██████╔╝╚██████╔╝██║ ╚═╝ ██║███████╗",
  "               ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚══════╝",
];

function printThunderdomeBanner(): void {
  console.log();
  for (const line of THUNDER_ART) console.log(chalk.red.bold(line));
  console.log();
  for (const line of DOME_ART) console.log(chalk.red.bold(line));
  console.log();
}

function printMatchup(combatants: Array<{ name: string }>, task?: string): void {
  const names = combatants.map(c => c.name.toUpperCase());
  const vs = names.map(n => chalk.bold.white(n)).join(chalk.bold.yellow("   ⚔   "));
  const count = combatants.length === 2 ? "two" : String(combatants.length);
  const nameList = names.length === 2
    ? `${names[0]} and ${names[1]}`
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  const D = chalk.dim("═".repeat(62));
  const d = chalk.dim("─".repeat(62));

  console.log(D);
  console.log(chalk.bold.yellow("  LADIES AND GENTLEMEN, BOYS AND GIRLS."));
  console.log(d);
  console.log(chalk.dim(`  And now, I've got ${count} agents —`));
  console.log(chalk.dim(`  ${nameList} —`));
  console.log(chalk.dim("  agents with a context full of fear."));
  console.log();
  console.log(chalk.bold.red("  DYING TIME'S HERE."));
  console.log(D);
  console.log();
  console.log(`  ${vs}`);
  if (task) {
    console.log();
    console.log(chalk.dim(`  ${task}`));
  }
  console.log();
  console.log(chalk.dim("  Tokens are the blood that runs the gauntlet."));
  console.log(d);
  console.log(chalk.bold.yellow(`  ANY ${count.toUpperCase()} AGENTS ENTER.  ONE LEAVES.`));
  console.log(D);
  console.log();
}

function isExitPromptError(e: unknown): boolean {
  if (e == null || typeof e !== "object") return false;
  const name = (e as { name?: unknown }).name;
  const msg = (e as { message?: unknown }).message;
  return name === "ExitPromptError" || (typeof msg === "string" && msg.includes("User force closed"));
}

async function runThunderdomeMenu(): Promise<void> {
  const { input, checkbox, select, Separator } = await import("@inquirer/prompts");
  const { detectAgents } = await import("./setup.js");
  const detectedIds = new Set(detectAgents().map((a: { id: string }) => a.id));

  printThunderdomeBanner();

  type Step = "task" | "combatants" | "mode" | "launch" | "confirm";
  const BACK = "__back__";

  let step: Step = "task";
  let task = "";
  let combatants: Array<{ id: string; name: string }> = [];
  let mode: "classic" | "arena" = "arena";
  let launchMode: "auto" | "manual" = "manual";
  const arenaDir = ".thunderdome";

  while (true) {
    try {
      switch (step) {

        case "task": {
          const val = await input({
            message: chalk.bold("What are they fighting over?") + chalk.dim(" (empty = exit)"),
            default: task || undefined,
          });
          if (!val.trim()) {
            console.log(chalk.dim("No task. The gauntlet closes."));
            return;
          }
          task = val.trim();
          step = "combatants";
          break;
        }

        case "combatants": {
          // Only show harnesses that have a headless launch spec
          const fightableHarnesses = KNOWN_HARNESSES.filter(h => launchSpecForId(h.id) != null);
          const choices = fightableHarnesses.map(h => ({
            name: detectedIds.has(h.id) ? `${h.name}  ${chalk.green("(detected)")}` : h.name,
            value: { id: h.id, name: h.name },
            checked: combatants.some(c => c.id === h.id),
          }));
          const result = await checkbox<{ id: string; name: string }>({
            message: chalk.bold("Select combatants:") + chalk.dim(" (ESC = back)"),
            choices,
          });
          if (result.length < 2) {
            console.error(chalk.red("  Need at least two combatants."));
            break;
          }
          combatants = result;
          step = "mode";
          break;
        }

        case "mode": {
          const val = await select<"classic" | "arena" | "__back__">({
            message: chalk.bold("Battle mode:"),
            choices: [
              { name: chalk.dim("← Back"), value: BACK as "__back__" },
              new Separator("─────────────────────────────────────────────────────"),
              { name: "Thunderdome arena  — agents write proposals to a shared workspace", value: "arena" as const },
              { name: "Classic duel       — copy-paste prompts, judge manually", value: "classic" as const },
            ],
          });
          if (val === BACK) { step = "combatants"; break; }
          mode = val;
          step = mode === "arena" ? "launch" : "confirm";
          break;
        }

        case "launch": {
          const val = await select<"auto" | "manual" | "__back__">({
            message: chalk.bold("Launch mode:"),
            choices: [
              { name: chalk.dim("← Back"), value: BACK as "__back__" },
              new Separator("─────────────────────────────────────────────────────"),
              { name: "Auto-launch  — fire claude -p and codex -q automatically", value: "auto" as const },
              { name: "Manual       — copy-paste each prompt into its respective CLI", value: "manual" as const },
            ],
          });
          if (val === BACK) { step = "mode"; break; }
          launchMode = val;
          step = "confirm";
          break;
        }

        case "confirm": {
          const thin = chalk.dim("─".repeat(54));
          console.log(`\n${thin}`);
          console.log(`  ${chalk.bold("Task:")}    ${task}`);
          console.log(`  ${chalk.bold("Agents:")}  ${combatants.map(c => c.name).join(chalk.dim(" vs "))}`);
          if (mode === "arena") {
            console.log(`  ${chalk.bold("Arena:")}   ${arenaDir}/`);
            console.log(`  ${chalk.bold("Launch:")}  ${launchMode === "auto" ? "Auto (claude -p, codex -q)" : "Manual (paste prompts)"}`);
          }
          console.log(thin);

          const val = await select<"go" | "back" | "cancel">({
            message: chalk.bold.red("Dying time's here."),
            choices: [
              { name: chalk.green("⚔  Start the fight"), value: "go" },
              { name: chalk.dim("← Back"), value: "back" },
              { name: chalk.dim("✗  Cancel"), value: "cancel" },
            ],
          });

          if (val === "back") { step = mode === "arena" ? "launch" : "mode"; break; }
          if (val === "cancel") {
            console.log(chalk.dim("Fight called off. The gauntlet closes. Tokens saved."));
            return;
          }

          printThunderdomeBanner();
          printMatchup(combatants, task);

          if (mode === "arena") {
            await executeArenaFight(task, combatants, arenaDir, launchMode === "auto");
          } else {
            executeClassicDuel(task, combatants, 1);
          }
          return;
        }

      }
    } catch (e: unknown) {
      if (isExitPromptError(e)) {
        switch (step) {
          case "task": return;
          case "combatants": step = "task"; break;
          case "mode": step = "combatants"; break;
          case "launch": step = "mode"; break;
          case "confirm": step = mode === "arena" ? "launch" : "mode"; break;
        }
        process.stdout.write("\n");
        continue;
      }
      throw e;
    }
  }
}

type SpawnedProcess = { name: string; id: string; child: ReturnType<typeof spawn>; logStream: ReturnType<typeof createWriteStream> };

function spawnContestant(
  combatant: { id: string; name: string },
  prompt: string,
  launchCtx: { contestantDir: string; arenaDir: string },
  arenaDir: string,
  logSuffix: string,
): SpawnedProcess | null {
  const spec = launchSpecForId(combatant.id);
  if (!spec) return null;

  const argsOrNull = spec.launchArgs(launchCtx);
  if (!argsOrNull) return null;

  const args = argsOrNull;
  const logPath = join(launchCtx.contestantDir, `.session${logSuffix}.log`);
  const logStream = createWriteStream(logPath);
  const spawnEnv = { ...process.env, CI: "1", NO_COLOR: "1", FORCE_COLOR: "0" };

  // Always use contestantDir as cwd so session-scoped flags (--continue / resume --last)
  // find the right previous session rather than a random project-root conversation
  const spawnCwd = launchCtx.contestantDir;

  let child: ReturnType<typeof spawn>;
  if (spec.promptViaArg) {
    // Prompt is the final positional argument — no stdin handling needed.
    // Node's spawn quotes the argument correctly without shell:true.
    child = spawn(spec.cmd, [...args, prompt], { cwd: spawnCwd, stdio: ["ignore", "pipe", "pipe"], env: spawnEnv });
  } else if (process.platform === "win32" && spec.promptViaFileRedirect) {
    // Write prompt to file, redirect into process via shell — avoids piped-stdin
    // issues where the CLI doesn't read from a Node-managed pipe handle.
    // shell:true lets cmd.exe parse the < redirection natively without Node
    // adding an extra quoting layer around the command string.
    const promptFile = join(launchCtx.contestantDir, `_prompt${logSuffix}.txt`);
    writeFileSync(promptFile, prompt, "utf8");
    const cmdStr = [spec.cmd, ...args, `< "${promptFile}"`].join(" ");
    child = spawn(cmdStr, { cwd: spawnCwd, shell: true, stdio: ["ignore", "pipe", "pipe"], env: spawnEnv });
  } else if (process.platform === "win32") {
    child = spawn("cmd.exe", ["/c", spec.cmd, ...args], { cwd: spawnCwd, stdio: ["pipe", "pipe", "pipe"], env: spawnEnv });
    child.stdin!.write(prompt, "utf8");
    child.stdin!.end();
  } else {
    child = spawn(spec.cmd, args, { cwd: spawnCwd, stdio: ["pipe", "pipe", "pipe"], env: spawnEnv });
    child.stdin!.write(prompt, "utf8");
    child.stdin!.end();
  }
  child.stdout?.pipe(logStream, { end: false });
  child.stderr?.pipe(logStream, { end: false });
  console.log(
    chalk.bold.red(`  ⚡ ${combatant.name.toUpperCase()} HAS ENTERED THE ARENA`) +
    chalk.dim(` — pid ${child.pid ?? "?"} — log: ${arenaDir}/contestants/${combatant.id}/.session${logSuffix}.log`)
  );
  return { name: combatant.name, id: combatant.id, child, logStream };
}

async function waitForProcesses(processes: SpawnedProcess[], label: string): Promise<void> {
  console.log();
  console.log(chalk.bold.yellow(`  ${label}`));
  await Promise.all(processes.map(({ name, child, logStream }) =>
    new Promise<void>(resolve => {
      child.on("close", code => {
        logStream.end();
        const icon = code === 0 ? chalk.green("✓") : chalk.red("✗");
        console.log(`  ${icon} ${name} — ${code === 0 ? "done" : `exited with code ${code ?? "?"}`}`);
        resolve();
      });
    })
  ));
}

async function executeArenaFight(
  task: string,
  combatants: Array<{ id: string; name: string }>,
  arenaDir: string,
  autoLaunch: boolean,
): Promise<void> {
  const cwd = process.cwd();
  const arenaPath = join(cwd, arenaDir);
  const contestants = combatants.map(c => ({ id: c.id, name: c.name }));

  initArena(arenaPath, task, contestants);
  console.log(chalk.dim(`  Arena open: ${arenaDir}/\n`));

  if (autoLaunch) {
    // ── Phase 1: Implement and Propose ────────────────────────────────────────
    console.log(chalk.bold.yellow("  PHASE 1 — Implement and Propose"));
    console.log(chalk.dim("  Tokens are the blood that runs the gauntlet.\n"));

    const phase1: SpawnedProcess[] = [];
    for (const combatant of combatants) {
      const launchCtx = { contestantDir: join(arenaPath, "contestants", combatant.id), arenaDir: arenaPath };
      const opponents = contestants.filter(c => c.id !== combatant.id);
      const prompt = buildPhase1Prompt(task, combatant, opponents, arenaPath);
      const spawned = spawnContestant(combatant, prompt, launchCtx, arenaDir, "");
      if (!spawned) {
        console.log(chalk.yellow(`  ⚠  ${combatant.name}: no headless CLI — paste this prompt manually:`));
        console.log();
        console.log(prompt);
        console.log();
      } else {
        phase1.push(spawned);
      }
    }

    if (phase1.length > 0) {
      await waitForProcesses(phase1, "Waiting for proposals...");
    }

    refreshArenaStatus(arenaPath, task, contestants);

    // ── Phase 2: Attack ────────────────────────────────────────────────────────
    console.log();
    console.log(chalk.bold.yellow("  PHASE 2 — Attack"));
    console.log(chalk.dim("  All proposals in. Now read and attack.\n"));

    const phase2: SpawnedProcess[] = [];
    for (const combatant of combatants) {
      const launchCtx = { contestantDir: join(arenaPath, "contestants", combatant.id), arenaDir: arenaPath };
      const opponents = contestants.filter(c => c.id !== combatant.id);
      const prompt = buildPhase2Prompt(task, combatant, opponents, arenaPath);
      const spawned = spawnContestant(combatant, prompt, launchCtx, arenaDir, "-p2");
      if (!spawned) {
        console.log(chalk.yellow(`  ⚠  ${combatant.name}: no headless CLI — paste this attack prompt manually:`));
        console.log();
        console.log(prompt);
        console.log();
      } else {
        phase2.push(spawned);
      }
    }

    if (phase2.length > 0) {
      await waitForProcesses(phase2, "Waiting for attacks...");
    }

    refreshArenaStatus(arenaPath, task, contestants);

    // ── Phase 3: Judgment — sequential debate until one concedes ──────────────
    const MAX_JUDGMENT_ROUNDS = 3;
    console.log();
    console.log(chalk.bold.yellow("  PHASE 3 — Judgment"));
    console.log(chalk.dim(`  Agents debate who wins. Max ${MAX_JUDGMENT_ROUNDS} rounds. No winner = both die.\n`));

    let judgmentWinner: string | null = null;
    let round = 1;

    outer: while (round <= MAX_JUDGMENT_ROUNDS) {
      console.log(chalk.dim(`  Round ${round}/${MAX_JUDGMENT_ROUNDS}:`));
      for (const combatant of combatants) {
        const launchCtx = { contestantDir: join(arenaPath, "contestants", combatant.id), arenaDir: arenaPath };
        const opponents = contestants.filter(c => c.id !== combatant.id);
        const prompt = buildJudgmentPrompt(round, combatant, opponents, arenaPath);
        const spawned = spawnContestant(combatant, prompt, launchCtx, arenaDir, `-j${round}`);
        if (!spawned) {
          console.log(chalk.yellow(`  ⚠  ${combatant.name}: no headless CLI`));
          continue;
        }
        await waitForProcesses([spawned], `  ${combatant.name} deliberating...`);
        judgmentWinner = detectJudgmentWinner(arenaPath, contestants);
        if (judgmentWinner) break outer;
      }
      round++;
    }

    if (judgmentWinner) {
      console.log();
      console.log(chalk.bold.green(`  ⚔  WINNER: ${judgmentWinner.toUpperCase()}`));
      console.log(chalk.dim(`  The gauntlet has spoken. One left.`));
      writeFileSync(join(arenaPath, "VERDICT.md"), `# VERDICT\n\nWINNER: ${judgmentWinner}\n\nDecided by judgment consensus in Phase 3.\n`, "utf8");
    } else {
      console.log();
      console.log(chalk.bold.red(`  No consensus after ${MAX_JUDGMENT_ROUNDS} rounds. Both die. Tribunal decides.`));
      console.log(chalk.dim(`  abyss duel --judge --arena-dir ${arenaDir}`));
    }

    refreshArenaStatus(arenaPath, task, contestants);
    console.log();
    console.log(chalk.bold.yellow("  The gauntlet is run."));
  } else {
    const thin = "─".repeat(60);
    console.log(chalk.bold.yellow("  PHASE 1 — Implement and Propose"));
    console.log(chalk.dim("  Paste each prompt into its respective CLI. Run Phase 2 prompts after all proposals are filed.\n"));
    for (const combatant of combatants) {
      const opponents = contestants.filter(c => c.id !== combatant.id);
      console.log(thin);
      console.log(chalk.bold.cyan(`  PHASE 1 PROMPT FOR: ${combatant.name.toUpperCase()}`));
      console.log(thin);
      console.log(buildPhase1Prompt(task, combatant, opponents, arenaPath));
      console.log();
    }
    console.log();
    console.log(chalk.bold.yellow("  PHASE 2 — Attack (run after all proposals are filed)"));
    for (const combatant of combatants) {
      const opponents = contestants.filter(c => c.id !== combatant.id);
      console.log(thin);
      console.log(chalk.bold.cyan(`  PHASE 2 PROMPT FOR: ${combatant.name.toUpperCase()}`));
      console.log(thin);
      console.log(buildPhase2Prompt(task, combatant, opponents, arenaPath));
      console.log();
    }
  }

  console.log(chalk.dim("─".repeat(60)));
  console.log(chalk.dim(`  abyss duel --status --arena-dir ${arenaDir}`));
  console.log(chalk.dim(`  abyss duel --judge  --arena-dir ${arenaDir}`));
  console.log(chalk.dim(`  abyss duel --apply <winner> --arena-dir ${arenaDir}`));
  console.log(chalk.dim("─".repeat(60)));
}

function executeClassicDuel(
  task: string,
  combatants: Array<{ id: string; name: string }>,
  rounds: number,
): void {
  const thin = "─".repeat(60);
  console.log(chalk.dim("Paste each prompt below into its respective CLI. Return with the results.\n"));
  for (const combatant of combatants) {
    const opponents = combatants.filter(c => c.id !== combatant.id).map(c => c.name).join(", ");
    console.log(thin);
    console.log(chalk.bold.cyan(`  PROMPT FOR: ${combatant.name.toUpperCase()}`));
    console.log(thin);
    console.log(buildDuelPrompt(task, combatant.name, opponents, rounds));
    console.log();
  }
  const d = "═".repeat(60);
  console.log(d);
  console.log(chalk.dim("  When all combatants have responded: paste their outputs into the `duel` skill for a verdict."));
  console.log(chalk.dim("  For a shared arena: add --arena [--launch]"));
  console.log(d + "\n");
}

program
  .command("thunderdome")
  .alias("duel")
  .description("pit AI agents against each other — interactive arena or classic prompt battle. Two enter. One leaves.")
  .argument("[task...]", "the task or change the agents will fight over")
  .option("--harnesses <list>", "comma-separated harness IDs (default: all detected)")
  .option("--rounds <n>", "number of attack/defense rounds (classic mode)", "1")
  .option("--arena", "init arena — agents write proposals to a shared workspace")
  .option("--arena-dir <dir>", "arena directory", ".thunderdome")
  .option("--launch", "auto-launch harnesses that support headless mode (claude -p, codex -q)")
  .option("--status", "show current arena status")
  .option("--judge", "output all filed proposals formatted for judgment with the thunderdome skill")
  .option("--apply <contestant>", "copy a contestant's proposed files to the project root")
  .addHelpText("after", `
Examples:
  abyss thunderdome                                    interactive menu
  abyss thunderdome "add auth" --arena --launch        init arena and auto-fire agents
  abyss thunderdome "add auth" --arena                 init arena, paste prompts manually
  abyss thunderdome --status                           check who has filed proposals
  abyss thunderdome --judge                            aggregate proposals for verdict
  abyss thunderdome --apply claude-code                apply winner's files to codebase
  abyss thunderdome "add auth" --rounds 2              classic prompt battle, 2 rounds`)
  .action(async (taskParts: string[], options: {
    harnesses?: string;
    rounds: string;
    arena?: boolean;
    arenaDir: string;
    launch?: boolean;
    status?: boolean;
    judge?: boolean;
    apply?: string;
  }) => {
    const { detectAgents } = await import("./setup.js");
    const cwd = process.cwd();
    const arenaAbsDir = join(cwd, options.arenaDir);

    // ── Status ────────────────────────────────────────────────────────────────
    if (options.status) {
      const state = readArenaState(arenaAbsDir);
      if (!state) {
        console.error(`No arena at ${options.arenaDir}. Run: abyss duel <task> --arena`);
        process.exitCode = 1;
        return;
      }
      printArenaStatus(state, options.arenaDir);
      return;
    }

    // ── Judge ──────────────────────────────────────────────────────────────────
    if (options.judge) {
      const state = readArenaState(arenaAbsDir);
      if (!state) {
        console.error(`No arena at ${options.arenaDir}. Run: abyss duel <task> --arena`);
        process.exitCode = 1;
        return;
      }
      console.log(buildJudgeInput(arenaAbsDir, state));
      return;
    }

    // ── Apply winner ───────────────────────────────────────────────────────────
    if (options.apply) {
      const state = readArenaState(arenaAbsDir);
      if (!state) {
        console.error(`No arena at ${options.arenaDir}. Run: abyss duel <task> --arena`);
        process.exitCode = 1;
        return;
      }
      const winnerDir = contestantDir(arenaAbsDir, options.apply);
      if (!existsSync(winnerDir)) {
        console.error(`No contestant dir for "${options.apply}". Available: ${state.contestants.map(c => c.id).join(", ")}`);
        process.exitCode = 1;
        return;
      }
      const applied = applyContestantFiles(winnerDir, cwd);
      if (applied.length === 0) {
        console.log(`No implementation files for "${options.apply}" (only PROPOSAL.md / ATTACK.md).`);
      } else {
        console.log(chalk.bold.green(`\nApplied ${options.apply}'s proposal (${applied.length} file${applied.length > 1 ? "s" : ""}):`));
        for (const f of applied) console.log(`  ✓ ${f}`);
        console.log(`\nReview and commit when ready.`);
      }
      return;
    }

    // ── No task → interactive menu ─────────────────────────────────────────────
    const task = taskParts.join(" ").trim();
    if (!task && !options.harnesses) {
      await runThunderdomeMenu();
      return;
    }

    if (!task) {
      console.error("Provide a task. Example: abyss duel \"implement auth\" --arena --launch");
      process.exitCode = 1;
      return;
    }

    const allDetected = detectAgents();
    const combatants = options.harnesses
      ? options.harnesses.split(",").map(h => h.trim()).map(id => {
          const found = allDetected.find(a => a.id === id);
          return found ?? { id, name: id };
        })
      : allDetected;

    if (combatants.length < 2) {
      console.error(combatants.length === 0
        ? "No harnesses detected. Install at least one AI CLI or specify --harnesses."
        : "A duel requires at least two combatants.");
      process.exitCode = 1;
      return;
    }

    printThunderdomeBanner();
    printMatchup(combatants, task);

    if (options.arena) {
      await executeArenaFight(task, combatants, options.arenaDir, options.launch ?? false);
    } else {
      const rounds = Math.max(1, parseInt(options.rounds, 10) || 1);
      executeClassicDuel(task, combatants, rounds);
    }
  });

function printArenaStatus(state: ArenaState, arenaDir: string): void {
  const D = chalk.dim("═".repeat(62));
  const d = chalk.dim("─".repeat(62));
  console.log(`\n${D}`);
  console.log(chalk.bold.red("  THUNDERDOME STATUS"));
  console.log(chalk.dim(`  Arena: ${arenaDir}/  |  Task: ${state.task}`));
  console.log(D);
  console.log();

  for (const c of state.contestants) {
    const filed = state.filed.includes(c.id);
    if (filed) {
      console.log(`  ${chalk.green("⚔")} ${chalk.bold(c.name)}  ${chalk.green("— proposal filed")}`);
    } else {
      console.log(`  ${chalk.dim("⏳")} ${c.name}  ${chalk.dim("— still in the gauntlet")}`);
    }
  }

  console.log();

  if (state.judged) {
    console.log(chalk.bold.green("  VERDICT RENDERED — see VERDICT.md"));
    console.log(chalk.dim("  One left. One didn't."));
  } else if (state.filed.length === state.contestants.length) {
    console.log(chalk.bold.yellow("  ALL PROPOSALS FILED."));
    console.log(chalk.dim("  Bust a deal, face the wheel."));
    console.log(d);
    console.log(chalk.dim(`  abyss duel --judge  --arena-dir ${arenaDir}`));
    console.log(chalk.dim(`  abyss duel --apply <winner> --arena-dir ${arenaDir}`));
  } else {
    const pending = state.contestants.filter(c => !state.filed.includes(c.id)).map(c => c.name);
    console.log(chalk.dim(`  Still in the gauntlet: ${pending.join(", ")}`));
    console.log(chalk.dim(`  Tokens are running. Proposals are pending.`));
  }

  console.log(`\n${D}\n`);
}

function buildDuelPrompt(task: string, myName: string, opponents: string, rounds: number): string {
  const roundBlocks: string[] = [];

  for (let r = 1; r <= rounds; r++) {
    if (r === 1) {
      roundBlocks.push(`ROUND ${r} — PROPOSAL
State your specific approach to the task. No hedging. No "it depends." Commit.
Format:
  PROPOSAL:   <your concrete approach>
  RATIONALE:  <one strong argument for why this is correct>`);
    } else {
      roundBlocks.push(`ROUND ${r} — ATTACK AND DEFEND
Attack: identify the specific failure mode in ${opponents}'s approach from the previous round.
Defend: answer their attack on yours.
Format:
  ATTACK:   <the exact place their approach breaks — be specific, not general>
  EVIDENCE: <what will happen when it breaks>
  DEFENSE:  <direct answer to their attack on your proposal>`);
    }
  }

  roundBlocks.push(`CLOSING
One sentence. Why you should implement this task. Not ${opponents}.`);

  return [
    `YOU ARE IN A DUEL.`,
    ``,
    `Task under contention: ${task}`,
    ``,
    `You are ${myName}.`,
    `Your opponent${opponents.includes(",") ? "s" : ""}: ${opponents}.`,
    ``,
    `Rules:`,
    `- Be specific. Vague answers lose.`,
    `- Attack the actual weakness, not a strawman.`,
    `- Do not concede unless you mean it.`,
    `- The best argument wins. Not the longest one.`,
    ``,
    ...roundBlocks.flatMap(b => [b, ""]),
  ].join("\n");
}

program
  .command("setup")
  .description("configure Abyss Stack for each selected agent CLI / harness (skills, MCP, hooks, instruction files)")
  .option("--force", "overwrite existing files and entries")
  .addHelpText("after", `
Examples:
  abyss setup               interactive harness + skill profile selection
  abyss setup --force       overwrite existing files (re-run after updates)`)
  .action(async (options: { force?: boolean }) => {
    await runSetup({ force: options.force ?? false });
  });

program
  .command("uninstall")
  .description("remove Abyss Stack configuration for selected harnesses")
  .action(async () => {
    await runUninstall({});
  });

program
  .command("models")
  .description("show model configuration — setup runs automatically at the start of an agent session")
  .action(() => {
    listConfiguredModels();
  });

program
  .command("skills")
  .description("list and install Abyss Stack skills and agents into a project folder")
  .argument("[skills...]", "skill or agent names to install; omit to list")
  .option("--list", "list available skills without installing")
  .option("--all", "install all non-dangerous skills and agents")
  .option("--allall", "install everything, including dangerous skills and agents")
  .option("--opex", "install operational excellence skills and agents: TOC and TPS only")
  .option("--category <category>", "install category: useful, fun, dangerous, or opex")
  .option("--path <dir>", "target directory", ".claude/skills")
  .option("--agents-path <dir>", "target directory for agents", ".claude/agents")
  .option("--spice <level>", "maximum preferred spice: mild, medium, hot, extra-hot, inferno, or a Scoville number")
  .option("--force", "overwrite existing files")
  .option("--yes", "confirm dangerous installs without prompting")
  .addHelpText("after", `
Examples:
  abyss skills                             list all available skills
  abyss skills --all                       install all non-dangerous skills
  abyss skills --opex                      install TOC + TPS operational excellence bundle
  abyss skills --allall --yes              install everything including dangerous
  abyss skills --spice hot                 list/install up to hot (75 000 SHU)
  abyss skills diagnose roast              install specific skills by name
  abyss skills --category fun              install all fun-category skills`)
  .action(async (skills: string[], options: { list?: boolean; all?: boolean; allall?: boolean; opex?: boolean; category?: string; path: string; agentsPath: string; spice?: string; force?: boolean; yes?: boolean }) => {
    const available = listSkills();
    const maxSpice = parsePreferredSpice(options.spice);
    if (Number.isNaN(maxSpice)) return;
    const withinSpice = available.filter(s => s.scoville <= maxSpice);
    const installCategory = parseInstallCategory(options.category, options.opex === true);
    if (installCategory === "__invalid") return;

    if (options.list || (!options.all && !options.allall && !installCategory && skills.length === 0)) {
      if (available.length === 0) {
        console.error("No skills found. Package may not include prompts/. Try reinstalling.");
        process.exit(1);
      }
      printSkillList(withinSpice, maxSpice);
      console.log(`\nInstall all non-dangerous: abyss skills --all --path ${options.path}`);
      console.log(`Install all up to spice:   abyss skills --all --spice hot --path ${options.path}`);
      console.log(`Install absolutely all:    abyss skills --allall --yes --path ${options.path}`);
      console.log(`Install OPEX bundle:       abyss skills --category opex --path ${options.path}`);
      console.log(`Install specific:          abyss skills diagnose roast --path ${options.path}`);
      console.log(`Install dangerous:         abyss skills burn --yes --path ${options.path}`);
      return;
    }

    const names = options.allall
      ? withinSpice.map(s => s.name)
      : options.all
      ? withinSpice.filter(s => s.category !== "dangerous").map(s => s.name)
      : installCategory
      ? withinSpice.filter(s => matchesInstallCategory(s, installCategory)).map(s => s.name)
      : skills;

    if (names.length === 0) {
      console.error(`No skills match preferred spice <= ${formatSpiceLimit(maxSpice)}.`);
      process.exitCode = 1;
      return;
    }

    const selected = available.filter(s => names.includes(s.name));
    const tooSpicy = selected.filter(s => s.scoville > maxSpice);
    if (tooSpicy.length > 0 && !(await confirmSpiceOverride(tooSpicy, maxSpice, options.yes === true))) {
      console.error("Spice override cancelled. Nothing was installed.");
      process.exitCode = 1;
      return;
    }

    const dangerous = selected.filter(s => s.category === "dangerous");
    if (dangerous.length > 0 && !(await confirmDangerousInstall(dangerous, options.yes === true))) {
      console.error("Dangerous install cancelled. Nothing was installed.");
      process.exitCode = 1;
      return;
    }

    const steps = installSkills(names, options.path, options.force ?? false, options.agentsPath);
    for (const step of steps) console.log(`  ✓ ${step}`);
    const installed = steps.filter(s => s.startsWith("Installed")).length;

    if (installed === 0) return;

    console.log(`\n  ${installed} item(s) installed.`);
    console.log(chalk.dim(`  Skills: ${options.path}  Agents: ${options.agentsPath}`));

    const harnesses = await promptHarnessSelection();
    if (harnesses.length === 0) {
      console.log("No harness selected. Run 'abyss setup' later to wire the routing index.");
      return;
    }
    await runSetup({ force: options.force ?? false, agents: harnesses });
  });

program.parse();

interface CliOptions {
  mode: string;
  safe?: boolean;
  moreEdge?: boolean;
  json?: boolean;
  analyze?: boolean;
  direction: string;
  remember?: boolean;
  memoryPath: string;
}

interface MemoryOptions {
  path: string;
  json?: boolean;
  format: "text" | "json";
  category?: string;
}

function parseMode(mode: string): AnttiMode {
  if (isAnttiMode(mode)) {
    return mode;
  }

  console.error(`Unknown mode "${mode}". Valid modes: ${ANTTI_MODES.join(", ")}`);
  process.exitCode = 1;
  throw new Error(`Unknown mode: ${mode}`);
}

function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = a[i - 1] === b[j - 1]
        ? d[i - 1][j - 1]
        : 1 + Math.min(d[i - 1][j], d[i][j - 1], d[i - 1][j - 1]);
  return d[m][n];
}

function printWarnings(result: AgentResponse): void {
  if (result.warnings.length === 0) {
    return;
  }

  console.error(result.warnings.map((warning) => `[warning] ${warning}`).join("\n"));
  console.error("");
}

function parseCodecDirection(direction: string): SatireDirection {
  if (direction === "reduce" || direction === "induce") {
    return direction;
  }

  console.error(`Unknown codec direction "${direction}". Valid directions: reduce, induce`);
  process.exitCode = 1;
  throw new Error(`Unknown codec direction: ${direction}`);
}

function formatCodecResult(result: ReturnType<typeof runCodec>): string {
  return [
    `normalizedText: ${result.normalizedText}`,
    `styledText: ${result.styledText}`,
    `extractedFacts: ${result.extractedFacts.join(" | ")}`,
    `removedStyleMarkers: ${result.removedStyleMarkers.join(" | ")}`,
    `warnings: ${result.warnings.join(" | ")}`,
    `riskLabels: ${result.riskLabels.join(" | ")}`
  ].join("\n");
}

function formatMemoryRecord(record: ReturnType<typeof listMemory>[number]): string {
  const tagSignals: Record<string, string> = {
    enterprise_gravity: "excel_as_production",
    corporate_fog: "trust_gap",
    emotional_weather: "status_anxiety",
    erp_archaeology: "excel_as_production",
    decision_fossils: "ownership_avoidance"
  };
  const gravityTag = record.tags.find((t) => t in tagSignals);
  const memeLine = gravityTag
    ? (() => {
        const m = selectMemeTemplate(
          { gravitySignals: [tagSignals[gravityTag] ?? ""], emotionSignals: [] },
          record.mode
        );
        return `meme: ${m.memeName} — "${m.text0}"`;
      })()
    : undefined;

  return [
    `${record.timestamp} | ${record.mode} | ${record.category ?? "general"} | ${record.tags.join(", ")}`,
    `input: ${record.input}`,
    `summary: ${record.outputSummary}`,
    record.warnings.length > 0 ? `warnings: ${record.warnings.join(" | ")}` : undefined,
    memeLine
  ].filter(Boolean).join("\n");
}

function formatAnalysis(analysis: AgentAnalysis): string {
  return [
    formatSection(
      "Banalizer",
      analysis.fog.map((finding) => `${finding.phrase} -> ${finding.replacement} (${finding.severity})`)
    ),
    formatSection(
      "ERP Archaeologist",
      analysis.erpFindings.map((finding) => `${finding.signal}: ${finding.reason}`)
    ),
    formatSection(
      "Datapoint Relator",
      analysis.relations.map((relation) => `${relation.left} <-> ${relation.right}: ${relation.hypothesis}`)
    ),
    formatSection("Governance Theatre", [
      analysis.governance.decision,
      ...analysis.governance.actionPoints.map((point) => `action: ${point}`)
    ]),
    `Architecture Box Renderer:\n${analysis.architecture.diagram}`
  ].join("\n\n");
}

function formatSection(title: string, rows: string[]): string {
  if (rows.length === 0) {
    return `${title}:\n- Nothing obvious. This is either fine or merely undocumented.`;
  }

  return `${title}:\n${rows.map((row) => `- ${row}`).join("\n")}`;
}

function parsePreferredSpice(value?: string): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const normalized = value.trim().toLowerCase().replace(/_/g, "-");
  if (SPICE_LEVELS[normalized] !== undefined) return SPICE_LEVELS[normalized];
  const numeric = Number(normalized.replace(/[,\s]/g, ""));
  if (Number.isFinite(numeric) && numeric >= 0) return numeric;
  console.error(`Unknown spice level "${value}". Use mild, medium, hot, extra-hot, inferno, or a Scoville number.`);
  process.exitCode = 1;
  return Number.NaN;
}

function spiceLabel(scoville: number): string {
  if (scoville <= SPICE_LEVELS.mild) return "mild";
  if (scoville <= SPICE_LEVELS.medium) return "medium";
  if (scoville <= SPICE_LEVELS.hot) return "hot";
  if (scoville <= SPICE_LEVELS["extra-hot"]) return "extra-hot";
  return "inferno";
}

function formatScoville(scoville: number): string {
  return `${scoville.toLocaleString("en-US")} SHU ${spiceLabel(scoville)}`;
}

function formatSpiceLimit(maxSpice: number): string {
  if (!Number.isFinite(maxSpice)) return "no limit";
  return `${maxSpice.toLocaleString("en-US")} SHU`;
}

type InstallCategory = SkillCategory | "opex";
type InstallCategorySelection = InstallCategory | "__invalid" | undefined;

function parseInstallCategory(value: string | undefined, opexAlias: boolean): InstallCategorySelection {
  if (!value && !opexAlias) return undefined;
  const category = value?.trim().toLowerCase();
  if (opexAlias && category && category !== "opex") {
    console.error(`--opex cannot be combined with --category ${value}. Use one install category.`);
    process.exitCode = 1;
    return "__invalid";
  }
  const selected = opexAlias ? "opex" : category;
  if (selected === "useful" || selected === "fun" || selected === "dangerous" || selected === "opex") {
    return selected;
  }
  console.error(`Unknown install category "${value}". Use useful, fun, dangerous, or opex.`);
  process.exitCode = 1;
  return "__invalid";
}

function matchesInstallCategory(skill: Skill, category: InstallCategory): boolean {
  if (category === "opex") return isOpexSkill(skill);
  return skill.category === category;
}

function isOpexSkill(skill: Skill): boolean {
  return skill.name === "antti-toc"
    || skill.name === "antti-tps"
    || skill.name.startsWith("toc-")
    || skill.name.startsWith("tps-");
}

function printSkillList(skills: Skill[], maxSpice: number): void {
  console.log("Available skills and agents:\n");
  if (Number.isFinite(maxSpice)) {
    console.log(`Preferred spice: <= ${formatSpiceLimit(maxSpice)}\n`);
  }
  if (skills.length === 0) {
    console.log("No skills match that spice preference.");
    return;
  }
  const categoryOrder: SkillCategory[] = ["useful", "fun", "dangerous"];
  const nameWidth = Math.max(...skills.map(s => s.name.length));
  for (const category of categoryOrder) {
    const items = skills.filter(s => s.category === category);
    if (items.length === 0) continue;
    console.log(`${category.toUpperCase()}`);
    for (const s of items) {
      const task = s.task ? `  ${s.task}` : "";
      console.log(`  ${s.name.padEnd(nameWidth)}  ${s.type.padEnd(5)}  ${formatScoville(s.scoville).padEnd(22)}${task}`);
    }
    console.log("");
  }
}

async function confirmSpiceOverride(items: Skill[], maxSpice: number, assumeYes: boolean): Promise<boolean> {
  if (!Number.isFinite(maxSpice)) return true;
  const names = items.map(s => `${s.name} (${formatScoville(s.scoville)})`).join(", ");
  const warning = `These exceed preferred spice <= ${formatSpiceLimit(maxSpice)}: ${names}`;
  if (assumeYes) {
    console.error(`[warning] ${warning}`);
    return true;
  }
  if (!process.stdin.isTTY || !process.stderr.isTTY) {
    console.error(`[warning] ${warning}`);
    console.error("Rerun with --yes to override preferred spice.");
    return false;
  }

  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    const answer = (await rl.question(`${warning}. Install anyway? [y/N] `)).trim().toLowerCase();
    return answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
}

async function confirmDangerousInstall(items: Skill[], assumeYes: boolean): Promise<boolean> {
  const names = items.map(s => s.name).join(", ");
  const warning = `Dangerous skills/agents can waste context, destroy useful signal, or recurse aggressively: ${names}`;
  if (assumeYes) {
    console.error(`[warning] ${warning}`);
    return true;
  }
  if (!process.stdin.isTTY || !process.stderr.isTTY) {
    console.error(`[warning] ${warning}`);
    console.error("Rerun with --yes to install dangerous items.");
    return false;
  }

  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    const answer = (await rl.question(`${warning}. Install anyway? [y/N] `)).trim().toLowerCase();
    return answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
}

function getImgflipConfigPath(): string {
  return join(homedir(), ".antti", "imgflip.json");
}

function loadImgflipCredentials(): void {
  const configPath = getImgflipConfigPath();
  if (!existsSync(configPath)) return;
  try {
    const data = JSON.parse(readFileSync(configPath, "utf8")) as { username?: string; password?: string };
    if (data.username && !process.env["IMGFLIP_USERNAME"]) process.env["IMGFLIP_USERNAME"] = data.username;
    if (data.password && !process.env["IMGFLIP_PASSWORD"]) process.env["IMGFLIP_PASSWORD"] = data.password;
  } catch {
    // corrupted config — ignore
  }
}

function saveImgflipCredentials(username: string, password: string): void {
  const configPath = getImgflipConfigPath();
  try {
    mkdirSync(dirname(configPath), { recursive: true });
    writeFileSync(configPath, JSON.stringify({ username, password }, null, 2), "utf8");
  } catch {
    // ignore write failure
  }
}

async function promptForImgflipCredentials(saveEnv: boolean): Promise<void> {
  console.error("Imgflip credentials are needed to generate a real meme URL.");
  console.error("They will be used for this request. By default they are also saved to your user environment for future terminals.");

  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    const username = (await rl.question("IMGFLIP_USERNAME: ")).trim();
    const password = await questionHidden("IMGFLIP_PASSWORD: ");

    if (!username || !password) {
      console.error("Imgflip credentials were not provided. Printing the meme template without a URL.");
      return;
    }

    process.env["IMGFLIP_USERNAME"] = username;
    process.env["IMGFLIP_PASSWORD"] = password;

    if (saveEnv) {
      saveImgflipCredentials(username, password);
      persistUserEnv("IMGFLIP_USERNAME", username);
      persistUserEnv("IMGFLIP_PASSWORD", password);
      console.error(`Saved credentials to ${getImgflipConfigPath()} and user environment.`);
      console.error("Credentials will be available immediately in this and all future terminals.");
    }
  } finally {
    rl.close();
  }
}

async function questionHidden(prompt: string): Promise<string> {
  const input = process.stdin;
  const output = process.stderr;

  if (!input.isTTY || !output.isTTY) {
    const rl = createInterface({ input, output });
    try {
      return await rl.question(prompt);
    } finally {
      rl.close();
    }
  }

  return new Promise((resolve) => {
    let value = "";
    output.write(prompt);
    input.setRawMode(true);
    input.resume();

    const cleanup = () => {
      input.off("data", onData);
      input.setRawMode(false);
      input.pause();
    };

    const onData = (chunk: Buffer) => {
      const char = chunk.toString("utf8");
      if (char === "\u0003") {
        cleanup();
        process.exit(130);
      }
      if (char === "\r" || char === "\n") {
        output.write("\n");
        cleanup();
        resolve(value);
        return;
      }
      if (char === "\b" || char === "\u007f") {
        value = value.slice(0, -1);
        return;
      }
      value += char;
    };

    input.on("data", onData);
  });
}

function persistUserEnv(name: string, value: string): void {
  if (process.platform === "win32") {
    execFileSync("setx", [name, value], { stdio: "ignore" });
    return;
  }

  console.error(`To persist ${name}, add it to your shell profile. This platform was not modified automatically.`);
}

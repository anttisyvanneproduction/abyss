import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS_ROOT = join(__dirname, "..", "prompts");
const SKILLS_DIR = join(PROMPTS_ROOT, "skills");
const AGENTS_DIR = join(PROMPTS_ROOT, "agents");

export interface Skill {
  name: string;
  path: string;
  type: "skill" | "agent";
  category: SkillCategory;
  scoville: number;
  trigger: string;
  task: string;
}

export type SkillCategory = "useful" | "fun" | "dangerous";

const CATEGORY_BY_NAME: Record<string, SkillCategory> = {
  "antti-projectplanner": "dangerous",
  "burn": "dangerous",
  "depress": "dangerous",

  "antti-theorganizationalanarchist": "fun",
  "budget": "fun",
  "casing": "fun",
  "thunderdome": "fun",
  "induce": "fun",
  "roast": "fun",
  "watermelon": "fun",

  "antti-aiarchitect": "useful",
  "antti-archaeologist": "useful",
  "antti-auditor": "useful",
  "antti-builder": "useful",
  "antti-junior": "useful",
  "antti-toc": "useful",
  "antti-tps": "useful",
  "antti-writer": "useful",
};

function categoryFor(name: string): SkillCategory {
  if (CATEGORY_BY_NAME[name]) return CATEGORY_BY_NAME[name];
  if (name.startsWith("toc-") || name.startsWith("tps-")) return "useful";
  return "useful";
}

const SCOVILLE_BY_NAME: Record<string, number> = {
  "antti-builder": 500,
  "antti-junior": 500,
  "commit": 500,
  "tps-5s": 800,
  "tps-kanban": 900,
  "tps-genba": 1000,
  "tps-genchi-genbutsu": 1000,
  "tps-5whys": 1200,
  "tps-kaizen": 1200,
  "tps-nemawashi": 1200,
  "tps-obeya": 1200,
  "tps-hansei": 1500,
  "tps-heijunka": 1500,
  "tps-poka-yoke": 1500,
  "tps-andon": 2000,
  "tps-jidoka": 2000,
  "tps-konnyaku-stone": 2000,
  "tps-muda-muri-mura": 2500,
  "antti-tps": 2500,
  "toc-transition": 2500,
  "toc-prerequisite": 3000,
  "spec": 3000,
  "toc-dbr": 3500,
  "toc-buffer": 4000,
  "toc-throughput": 4500,
  "toc-bottleneck": 5000,
  "toc-frt": 5000,
  "toc-cloud": 6000,
  "toc-crt": 7000,
  "toc-tact": 8000,
  "antti-toc": 8000,
  "plan": 9000,
  "jira": 10000,
  "estimate": 12000,
  "doccheck": 12000,
  "reduce": 12000,
  "meeting": 15000,
  "vendor-demo-decoder": 18000,
  "dataquality": 20000,
  "dataplatform": 25000,
  "masterdata": 30000,
  "archaeology": 30000,
  "antti-archaeologist": 30000,
  "diagnose": 35000,
  "preview": 40000,
  "compliance": 45000,
  "antti-auditor": 50000,
  "antti-writer": 5000,
  "antti-aiarchitect": 60000,
  "casing": 65000,
  "thunderdome": 69000,
  "induce": 70000,
  "budget": 90000,
  "roast": 120000,
  "watermelon": 150000,
  "antti-theorganizationalanarchist": 180000,
  "depress": 300000,
  "antti-projectplanner": 750000,
  "burn": 1600000,
};

function scovilleFor(name: string, category: SkillCategory): number {
  if (SCOVILLE_BY_NAME[name] !== undefined) return SCOVILLE_BY_NAME[name];
  if (name.startsWith("toc-")) return 5000;
  if (name.startsWith("tps-")) return 1500;
  if (category === "dangerous") return 250000;
  if (category === "fun") return 75000;
  return 10000;
}

function parseMeta(content: string): { trigger: string; task: string } {
  const triggerMatch = content.match(/<!--\s*trigger:\s*(.+?)\s*-->/);
  const taskMatch = content.match(/##\s*Task:\s*(.+)/);
  return {
    trigger: triggerMatch?.[1] ?? "",
    task: taskMatch?.[1]?.trim() ?? "",
  };
}

function readDir(dir: string, type: "skill" | "agent"): Skill[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith(".md"))
    .map(f => {
      const path = join(dir, f);
      const content = readFileSync(path, "utf8");
      const { trigger, task } = parseMeta(content);
      const name = basename(f, ".md");
      const category = categoryFor(name);
      return { name, path, type, category, scoville: scovilleFor(name, category), trigger, task };
    });
}

export function listSkills(): Skill[] {
  return [...readDir(SKILLS_DIR, "skill"), ...readDir(AGENTS_DIR, "agent")]
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Install skills to skillsDir and agents to agentsDir.
 * Pass the same dir for both to flatten everything into one location.
 */
export function installSkills(
  names: string[],
  skillsDir: string,
  force: boolean,
  agentsDir?: string
): string[] {
  const available = listSkills();

  if (available.length === 0) {
    return ["No skills bundled. Reinstall the package or run from source."];
  }

  const toInstall = names.length === 0
    ? available
    : available.filter(s => names.includes(s.name));

  if (toInstall.length === 0) {
    return [
      `No matching skills: ${names.join(", ")}`,
      `Available: ${available.map(s => s.name).join(", ")}`
    ];
  }

  const steps: string[] = [];

  for (const item of toInstall) {
    const targetDir = (item.type === "agent" && agentsDir) ? agentsDir : skillsDir;
    mkdirSync(targetDir, { recursive: true });
    const dest = join(targetDir, `${item.name}.md`);
    if (existsSync(dest) && !force) {
      steps.push(`Already present → ${dest} (use --force to overwrite)`);
      continue;
    }
    writeFileSync(dest, readFileSync(item.path, "utf8"), "utf8");
    steps.push(`Installed ${item.type} → ${dest}`);
  }

  return steps;
}

/**
 * Builds a skill routing index from installed skill/agent directories.
 * For Claude Code: references by name (loaded natively).
 * For other harnesses: embeds task description inline.
 */
export function buildSkillIndex(skillsDir: string, mode: "reference" | "inline", agentsDir?: string): string {
  const items: Array<{ name: string; type: string; category: SkillCategory; scoville: number; trigger: string; task: string }> = [];

  for (const dir of [skillsDir, agentsDir].filter(Boolean) as string[]) {
    if (!existsSync(dir)) continue;
    readdirSync(dir)
      .filter(f => f.endsWith(".md"))
      .forEach(f => {
        const content = readFileSync(join(dir, f), "utf8");
        const { trigger, task } = parseMeta(content);
        const name = basename(f, ".md");
        const category = categoryFor(name);
        if (trigger) items.push({ name, type: dir === agentsDir ? "agent" : "skill", category, scoville: scovilleFor(name, category), trigger, task });
      });
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  if (items.length === 0) return "";

  const lines: string[] = [
    "## Abyss Stack — Skill & Agent Routing",
    "",
    "When the user's request matches a trigger, load the corresponding skill or agent.",
    "",
  ];

  if (mode === "reference") {
    lines.push("Skills are in `.claude/skills/`. Agents are in `.claude/agents/`. Match the trigger to the name and read the file before responding.", "");
    lines.push("| Name | Type | Category | Scoville | Triggers |");
    lines.push("|---|---|---|---:|---|");
    for (const s of items) {
      lines.push(`| \`${s.name}\` | ${s.type} | ${s.category} | ${s.scoville} | ${s.trigger} |`);
    }
  } else {
    lines.push("No native skill loading in this harness. Use the task description to guide your response.", "");
    lines.push("| Name | Type | Category | Scoville | Task | Triggers |");
    lines.push("|---|---|---|---:|---|---|");
    for (const s of items) {
      lines.push(`| \`${s.name}\` | ${s.type} | ${s.category} | ${s.scoville} | ${s.task} | ${s.trigger} |`);
    }
  }

  return lines.join("\n");
}

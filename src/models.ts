import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoleConfig {
  model: string;
  endpoint?: string;
  provider?: string;
}

export interface ModelsConfig {
  generated: string;
  roles: Record<string, RoleConfig>;
}

export interface LocalModel {
  id: string;
  endpoint: string;
  provider: "lmstudio" | "ollama" | "openai-compat";
}

// ---------------------------------------------------------------------------
// Agent roles
// ---------------------------------------------------------------------------

export const AGENT_ROLES = [
  { id: "main",          label: "Main agent (Antti)",            tier: "balanced" },
  { id: "junior",        label: "Junior (SQL, simple tasks)",     tier: "fast"     },
  { id: "archaeologist", label: "Archaeologist (code investigation)", tier: "fast"  },
  { id: "builder",       label: "Builder (surgical edits)",       tier: "fast"     },
  { id: "auditor",       label: "Auditor (code review)",          tier: "balanced" },
  { id: "commit",        label: "Commit message generator",       tier: "fast"     },
  { id: "review",        label: "Reviewer (PR review)",           tier: "balanced" },
] as const;

// ---------------------------------------------------------------------------
// Config path
// ---------------------------------------------------------------------------

const CONFIG_DIR = join(homedir(), ".antti");
const CONFIG_PATH = join(CONFIG_DIR, "models.json");

export function getConfigPath(): string { return CONFIG_PATH; }

// ---------------------------------------------------------------------------
// Config I/O
// ---------------------------------------------------------------------------

export function readModelsConfig(): ModelsConfig | null {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as ModelsConfig;
  } catch {
    return null;
  }
}

export function writeModelsConfig(config: ModelsConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf8");
}

export function getModelForRole(roleId: string): string | null {
  return readModelsConfig()?.roles[roleId]?.model ?? null;
}

export function isConfigFresh(): boolean {
  try {
    const stat = readFileSync(CONFIG_PATH);
    void stat;
    const config = readModelsConfig();
    if (!config?.generated) return false;
    const age = Date.now() - new Date(config.generated).getTime();
    return age < 30 * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Model test — agent calls this to verify a model responds before saving
// ---------------------------------------------------------------------------

export async function testModel(model: LocalModel): Promise<{ ok: boolean; ms: number; error?: string }> {
  const start = Date.now();
  try {
    const isOllama = model.provider === "ollama";
    const endpoint = isOllama
      ? `${model.endpoint}/api/chat`
      : `${model.endpoint}/v1/chat/completions`;

    const body = isOllama
      ? JSON.stringify({ model: model.id, messages: [{ role: "user", content: "Reply with exactly: ok" }], stream: false })
      : JSON.stringify({ model: model.id, messages: [{ role: "user", content: "Reply with exactly: ok" }], max_tokens: 10 });

    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(30000)
    });

    if (!r.ok) return { ok: false, ms: Date.now() - start, error: `HTTP ${r.status}` };
    await r.json();
    return { ok: true, ms: Date.now() - start };
  } catch (err) {
    return { ok: false, ms: Date.now() - start, error: err instanceof Error ? err.message : "Network error" };
  }
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

export function listConfiguredModels(): void {
  const config = readModelsConfig();
  if (!config) {
    console.log("No model configuration found. Start a new agent session — the setup runs automatically.");
    return;
  }
  const age = Math.round((Date.now() - new Date(config.generated).getTime()) / 86400000);
  console.log(`Model configuration (${age} day(s) old — refreshes after 30):\n`);
  for (const role of AGENT_ROLES) {
    const r = config.roles[role.id];
    console.log(`  ${role.label.padEnd(36)} ${r?.model ?? "(not configured)"}`);
  }
}

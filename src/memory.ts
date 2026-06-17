import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import type { AgentResponse } from "./agent.js";
import { compress } from "./compress.js";
import { generateSpec, specMemorySummary } from "./spec.js";

export type MemoryCategory =
  | "corporate_fog"
  | "enterprise_gravity"
  | "emotional_weather"
  | "erp_archaeology"
  | "decision_fossils"
  | "satire_fixtures"
  | "reviewer_notes"
  | "general";

export interface MemoryRecord {
  timestamp: string;
  mode: string;
  input: string;
  outputSummary: string;
  warnings: string[];
  tags: string[];
  category: MemoryCategory;
}

export interface AddMemoryRequest {
  path: string;
  input: string;
  response: AgentResponse;
  tags?: string[];
  category?: MemoryCategory;
}

const SECRET_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b(?:password|secret|token|api[_-]?key)\s*[:=]\s*\S+/gi,
  /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g
];

export interface AddManualMemoryRequest {
  path: string;
  text: string;
  category: MemoryCategory;
  tags?: string[];
}

export interface AddContextMemoryRequest {
  path: string;
  text: string;
  source?: string;
  category?: MemoryCategory;
  tags?: string[];
}

export interface ContextMemoryResult {
  record: MemoryRecord;
  originalLength: number;
  compressedLength: number;
  reductionPercent: number;
  signalRemoved: string[];
}

export function addMemory(req: AddMemoryRequest): MemoryRecord {
  mkdirSync(dirname(req.path), { recursive: true });

  const tags = [...new Set(req.tags ?? inferTags(req.response))];
  const outputSummary = buildMethodologySummary(req.input, req.response);

  const record: MemoryRecord = {
    timestamp: new Date().toISOString(),
    mode: req.response.mode,
    input: scrubSecrets(req.input),
    outputSummary,
    warnings: req.response.warnings.map(scrubSecrets),
    tags,
    category: req.category ?? inferCategory(req.response, tags)
  };

  appendFileSync(req.path, `${JSON.stringify(record)}\n`, "utf8");
  return record;
}

export function addContextMemory(req: AddContextMemoryRequest): ContextMemoryResult {
  mkdirSync(dirname(req.path), { recursive: true });

  const clean = scrubSecrets(req.text.trim());
  const compressResult = compress(clean);
  const signals = inferSignalsFromText(clean);
  const category = req.category ?? (signals[0] as MemoryCategory | undefined) ?? "general";
  const tags = [...new Set([category, ...signals, ...(req.tags ?? []), req.source ?? "external"])];

  const record: MemoryRecord = {
    timestamp: new Date().toISOString(),
    mode: req.source ?? "external",
    input: clean.slice(0, 280),
    outputSummary: compressResult.compressed.slice(0, 280),
    warnings: compressResult.removedSignal.length > 0
      ? [`${compressResult.reductionPercent}% signal removed: ${compressResult.removedSignal.slice(0, 3).join(", ")}`]
      : [],
    tags,
    category
  };

  appendFileSync(req.path, `${JSON.stringify(record)}\n`, "utf8");

  return {
    record,
    originalLength: compressResult.originalWordCount,
    compressedLength: compressResult.compressedWordCount,
    reductionPercent: compressResult.reductionPercent,
    signalRemoved: compressResult.removedSignal
  };
}

export function addManualMemory(req: AddManualMemoryRequest): MemoryRecord {
  mkdirSync(dirname(req.path), { recursive: true });

  const clean = scrubSecrets(req.text.trim());
  const record: MemoryRecord = {
    timestamp: new Date().toISOString(),
    mode: "manual",
    input: clean,
    outputSummary: compress(clean).compressed.slice(0, 280),
    warnings: [],
    tags: [...new Set([req.category, ...(req.tags ?? [])])],
    category: req.category
  };

  appendFileSync(req.path, `${JSON.stringify(record)}\n`, "utf8");
  return record;
}

export function listMemory(path: string, category?: MemoryCategory): MemoryRecord[] {
  try {
    const records = readFileSync(path, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as MemoryRecord);
    return category ? records.filter((r) => r.category === category) : records;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function searchMemory(path: string, query: string, category?: MemoryCategory): MemoryRecord[] {
  const needle = query.toLowerCase();
  return listMemory(path, category).filter((record) => {
    return [record.input, record.outputSummary, ...record.warnings, ...record.tags]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });
}

export function scrubSecrets(value: string): string {
  return SECRET_PATTERNS.reduce((text, pattern) => text.replace(pattern, "[redacted]"), value);
}

function buildMethodologySummary(input: string, response: AgentResponse): string {
  const analysis = response.analysis;
  const hasSignals =
    analysis.enterpriseGravity.length > 0 ||
    analysis.emotionalWeather.length > 0 ||
    analysis.erpFindings.length > 0;

  if (hasSignals) {
    const doc = generateSpec(input, analysis, [], []);
    return scrubSecrets(specMemorySummary(doc));
  }

  const clean = scrubSecrets(response.output).replace(/\s+/g, " ").trim();
  return compress(clean).compressed.slice(0, 280);
}

function inferSignalsFromText(text: string): MemoryCategory[] {
  const lower = text.toLowerCase();
  const signals: MemoryCategory[] = [];
  if (/\b(excel|xlsx|csv|spreadsheet|final_final|manual mapping)\b/.test(lower)) signals.push("corporate_fog");
  if (/\b(teams|sharepoint|power bi|azure|entra|licensing|m365|copilot)\b/.test(lower)) signals.push("enterprise_gravity");
  if (/\b(deadline|go.live|alignment|ownership|nobody owns|budget|steering group)\b/.test(lower)) signals.push("emotional_weather");
  if (/\b(SAP|Oracle|ERP|mapping|field|schema|ZZ_|deprecated)\b/.test(text)) signals.push("erp_archaeology");
  if (/\b(decided|decision|agreed|approved|deferred|rejected)\b/.test(lower)) signals.push("decision_fossils");
  return signals;
}

function inferTags(response: AgentResponse): string[] {
  const tags: string[] = [response.mode];
  if (response.analysis.fog.length > 0) tags.push("corporate_fog");
  if (response.analysis.emotionalWeather.length > 0) tags.push("emotional_weather");
  if (response.analysis.enterpriseGravity.length > 0) tags.push("enterprise_gravity");
  if (response.analysis.erpFindings.length > 0) tags.push("erp_archaeology");
  return tags;
}

function inferCategory(response: AgentResponse, tags: string[]): MemoryCategory {
  if (response.mode === "codec" || response.mode === "satirize" || response.mode === "desatirize") {
    return "satire_fixtures";
  }
if (tags.includes("enterprise_gravity")) return "enterprise_gravity";
  if (tags.includes("emotional_weather")) return "emotional_weather";
  if (tags.includes("corporate_fog")) return "corporate_fog";
  if (tags.includes("erp_archaeology")) return "erp_archaeology";
  return "general";
}

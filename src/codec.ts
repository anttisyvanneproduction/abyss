export type SatireDirection = "reduce" | "induce";
export type SatireTone = "dry" | "neutral" | "playful";
export type SatireSafety = "strict" | "balanced";
export type SatireFormat = "plain" | "bullets";

export interface TransformTextRequest {
  direction: SatireDirection;
  input: string;
  tone?: SatireTone;
  safety?: SatireSafety;
  format?: SatireFormat;
}

export interface TransformTextResult {
  normalizedText: string;
  styledText: string;
  extractedFacts: string[];
  removedStyleMarkers: string[];
  warnings: string[];
  riskLabels: string[];
}

const CORPORATE_FOG_MARKERS = [
  "cross-functional",
  "innovation acceleration",
  "leverage",
  "stakeholder synergies",
  "unlock",
  "transformational value",
  "at scale",
  "paradigm"
] as const;

const LINKEDIN_MARKERS = [
  "i learned",
  "humbled",
  "honored",
  "thrilled",
  "10x",
  "thought leadership",
  "crushed it",
  "main-character"
] as const;

const MEAN_MARKERS = [
  "clown show",
  "confusing",
  "nobody can tell",
  "embarrassing",
  "lazy",
  "incompetent",
  "idiots",
  "stupid team"
] as const;

const ENTERPRISE_GRAVITY_MARKERS = [
  "m365",
  "office 365",
  "teams",
  "sharepoint",
  "excel",
  "power bi",
  "azure",
  "entra",
  "copilot",
  "licensing",
  "admin center",
  "semantic model",
  "migration"
] as const;

const CONDITIONAL_FACT_MARKERS = [
  "estimate",
  "estimated",
  "tiny fix",
  "if ",
  "mixed",
  "but ",
  "depends",
  "dependency",
  "dependencies",
  "pilot"
] as const;

const STYLE_MARKERS = [
  "obviously",
  "as one does",
  "this is fine",
  "naturally",
  "heroic",
  "visionary",
  "legendary",
  "revolutionary",
  "wildly",
  "clearly"
] as const;

const STYLE_MARKER_TOKENS = new Set(
  STYLE_MARKERS.flatMap((marker) => marker.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? [])
);

export function transformText(req: TransformTextRequest): TransformTextResult {
  const normalizedText = normalize(req.input);
  const safety = req.safety ?? "strict";
  const tone = req.tone ?? "dry";
  const format = req.format ?? "plain";

  const removedStyleMarkers = findStyleMarkers(normalizedText);
  const extractedFacts = extractFacts(normalizedText);
  const warnings: string[] = [];
  const riskLabels: string[] = classifyReviewRisks(normalizedText, req.direction);

  let styledText = req.direction === "reduce"
    ? reduceSatire(normalizedText)
    : induceSatire(normalizedText, tone, format);

  if (req.direction === "reduce" && removedStyleMarkers.length > 0) {
    warnings.push(`Removed style markers: ${removedStyleMarkers.join(", ")}`);
  }

  if (hasMeaningDrift(normalizedText, styledText)) {
    riskLabels.push("meaning_drift");
    warnings.push("Potential meaning drift detected; using deterministic fallback.");
    styledText = deterministicFallback(req.direction, normalizedText, tone, format);
  }

  const outputFacts = extractFacts(styledText);
  if (missingFacts(extractedFacts, outputFacts)) {
    riskLabels.push("fact_loss");
    warnings.push("Potential fact loss detected; restoring factual baseline.");
    styledText = deterministicFallback(req.direction, normalizedText, tone, format);
  }

  if (hasFactInvention(normalizedText, styledText)) {
    riskLabels.push("fact_invention");
    warnings.push("Potential fact invention detected; restoring factual baseline.");
    styledText = deterministicFallback(req.direction, normalizedText, tone, format);
  }

  if (safety === "strict") {
    styledText = enforceNoPersonalExperience(styledText);
  }

  return {
    normalizedText,
    styledText,
    extractedFacts,
    removedStyleMarkers,
    warnings,
    riskLabels: unique(riskLabels)
  };
}

function classifyReviewRisks(input: string, direction: SatireDirection): string[] {
  const lower = input.toLowerCase();
  const risks: string[] = [];

  if (containsAny(lower, CORPORATE_FOG_MARKERS)) {
    risks.push("corporate_fog");
    risks.push("meaning_drift");
  }
  if (containsAny(lower, LINKEDIN_MARKERS)) {
    risks.push("too_linkedin");
    risks.push("meaning_drift");
  }
  if (containsAny(lower, MEAN_MARKERS)) {
    risks.push("too_mean");
  }
  if (containsAny(lower, ENTERPRISE_GRAVITY_MARKERS)) {
    risks.push("partner_safe_enterprise_gravity");
  }
  if (direction === "induce" && containsAny(lower, CONDITIONAL_FACT_MARKERS)) {
    risks.push("fact_invented_risk");
  }
  if (direction === "induce" && /\b(mixed|but|tradeoff|trade-off)\b/.test(lower)) {
    risks.push("meaning_drift");
  }
  if (direction === "induce" && /\b\d+(?:\.\d+)?%|\b\d{2,}\b/.test(input)) {
    risks.push("fact_invented_risk");
  }

  return risks;
}

function normalize(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function findStyleMarkers(input: string): string[] {
  const lower = input.toLowerCase();
  return STYLE_MARKERS.filter((marker) => lower.includes(marker));
}

function reduceSatire(input: string): string {
  let text = input;
  for (const marker of STYLE_MARKERS) {
    const regex = new RegExp(`\\b${escapeRegExp(marker)}\\b`, "gi");
    text = text.replace(regex, "");
  }
  text = text
    .replace(/!+/g, ".")
    .replace(/\s+\b(?:is|are|was|were|be|being|been)\s*([,.;:!?]|$)/gi, "$1")
    .replace(/,+\s*\./g, ".")
    .replace(/\s+,+/g, ",")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+\./g, ".")
    .trim();
  return text.length > 0 ? text : input;
}

function induceSatire(input: string, tone: SatireTone, format: SatireFormat): string {
  const base = format === "bullets"
    ? input.split(/(?<=[.!?])\s+/).filter(Boolean).map((s) => `- ${s}`).join("\n")
    : input;

  if (tone === "neutral") {
    return `${base}\n\nAdministrative note: the facts remain unchanged.`;
  }
  if (tone === "playful") {
    return `${base}\n\nAdministrative note: still the same facts, now with ceremonial sparkle.`;
  }
  return `${base}\n\nAdministrative note: unchanged facts, less theater than average.`;
}

function deterministicFallback(
  direction: SatireDirection,
  input: string,
  tone: SatireTone,
  format: SatireFormat
): string {
  if (direction === "reduce") {
    return reduceSatire(input);
  }

  const summary = extractFacts(input);
  const content = summary.length > 0 ? summary.join("; ") : input;
  return induceSatire(content, tone, format);
}

function extractFacts(input: string): string[] {
  const sentences = input.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  return sentences.filter((sentence) => {
    return /\b\d{2,}\b/.test(sentence)
      || /\b(?:SAP|Oracle|Dynamics|ERP|Azure|SQL|API|CSV|PO)\b/.test(sentence)
      || /\b[A-Z]{2,}[A-Z0-9_]*\b/.test(sentence);
  });
}

function hasMeaningDrift(source: string, output: string): boolean {
  const sourceTokens = keyTokens(source);
  const outputTokens = new Set(keyTokens(output));
  const overlap = sourceTokens.filter((token) => outputTokens.has(token)).length;
  return sourceTokens.length > 0 && overlap / sourceTokens.length < 0.6;
}

function hasFactInvention(source: string, output: string): boolean {
  const srcNums = new Set(source.match(/\b\d{2,}\b/g) ?? []);
  const outNums = output.match(/\b\d{2,}\b/g) ?? [];
  for (const n of outNums) {
    if (!srcNums.has(n)) {
      return true;
    }
  }
  return false;
}

function missingFacts(expected: string[], actual: string[]): boolean {
  if (expected.length === 0) {
    return false;
  }
  return actual.length === 0;
}

function keyTokens(text: string): string[] {
  return unique((text.toLowerCase().match(/\b[a-z]{4,}\b/g) ?? []).filter((token) => {
    return token !== "administrative" && token !== "note" && !STYLE_MARKER_TOKENS.has(token);
  }));
}

function enforceNoPersonalExperience(text: string): string {
  return text
    .replace(/\bI\s+(have|had|saw|did|worked|experienced)\b/gi, "it")
    .replace(/\bmy\s+experience\b/gi, "available evidence");
}

function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

function containsAny(input: string, markers: readonly string[]): boolean {
  return markers.some((marker) => input.includes(marker));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

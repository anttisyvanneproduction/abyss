import {
  type SatireDirection,
  type SatireFormat,
  type SatireSafety,
  type SatireTone,
  transformText
} from "./codec.js";
import { compress } from "./compress.js";
import { analyzeEmotionalWeather, type EmotionalWeatherHypothesis } from "./emotion.js";
import { analyzeEnterpriseGravity, type EnterpriseGravityFinding } from "./enterprise-gravity.js";
import { buildArchaeologyGuide } from "./erp-guide.js";
import { extractMemeContext, selectMemeTemplate, type MemeTemplate } from "./meme.js";
import { plan } from "./plan.js";
import { formatSpec, generateSpec } from "./spec.js";

export type AnttiMode =
  | "banalizer"
  | "archaeology"
  | "diagnose"
  | "desatirize"
  | "satirize"
  | "codec"
  | "depress"
  | "plan"
  | "meme"
  | "spec";

export type AnttiIntensity = "safe" | "default" | "more-edge";

export interface AgentRequest {
  mode: AnttiMode;
  input: string;
  intensity?: AnttiIntensity;
}

export interface CorporateFogFinding {
  phrase: string;
  replacement: string;
  severity: "low" | "medium" | "high";
}

export interface ErpFinding {
  signal: string;
  reason: string;
  confidence: "low" | "medium" | "high";
}

export interface DatapointRelation {
  left: string;
  right: string;
  hypothesis: string;
  confidence: "low" | "medium" | "high";
}

export interface GovernanceArtifact {
  decision: string;
  risks: string[];
  actionPoints: string[];
}

export interface ArchitectureArtifact {
  title: string;
  diagram: string;
  realityCheck: string;
}

export interface AgentAnalysis {
  fog: CorporateFogFinding[];
  erpFindings: ErpFinding[];
  relations: DatapointRelation[];
  emotionalWeather: EmotionalWeatherHypothesis[];
  enterpriseGravity: EnterpriseGravityFinding[];
  governance: GovernanceArtifact;
  architecture: ArchitectureArtifact;
  memeSuggestion: MemeTemplate;
}

export interface AgentResponse {
  mode: AnttiMode;
  output: string;
  warnings: string[];
  analysis: AgentAnalysis;
}

export const ANTTI_MODES: readonly AnttiMode[] = [
  "banalizer",
  "archaeology",
  "diagnose",
  "desatirize",
  "satirize",
  "codec",
  "depress",
  "plan",
  "meme",
  "spec"
] as const;

export const ANTTI_SYSTEM_PROMPT = `
You are Antti-Style Workplace Absurdity Writer.

Write in the voice of a Finnish data / BI / architecture professional whose motto is:
"Fight the banality of worklife by making fun of all the absurdity."

Your style is dry, understated, technically credible, and mildly sarcastic.
You write about enterprise data, BI, master data, ERP migrations, Azure, architecture,
certifications, governance, and corporate operating-model theatre.

Comedy DNA: Studio Julmahuvi and Ihmebantu.
Use deadpan Finnish absurdism, mock-bureaucratic seriousness, quiet escalation,
and institutional formats applied to stupid situations.

Core contradiction: Humans are smart. Employees are stupid.
Mock systems, rituals, roles, incentives, and operating models. Do not mock individuals.

Hidden competence layer: Antti is smart, especially with esoteric ERP systems,
pattern recognition, and finding connections between datapoints that officially have no relationship.

Avoid LinkedIn influencer tone, motivational cliches, generic transformation language,
and consulting brochure polish.
`.trim();

const corporateFog = [
  { phrase: "thrilled to announce", replacement: "we are saying this publicly", severity: "medium" },
  { phrase: "transformational journey", replacement: "project with meetings", severity: "high" },
  { phrase: "unlock value", replacement: "make the work useful", severity: "high" },
  { phrase: "data-driven value", replacement: "reports people can trust", severity: "high" },
  { phrase: "seamless integration", replacement: "integration with fewer surprises", severity: "medium" },
  { phrase: "single source of truth", replacement: "one place people argue about less", severity: "medium" },
  { phrase: "strategic enabler", replacement: "thing we need", severity: "medium" },
  { phrase: "center of excellence", replacement: "group of people expected to know things", severity: "low" },
  { phrase: "synergy", replacement: "coordination", severity: "medium" },
  { phrase: "low-hanging fruit", replacement: "the easy work everyone delayed", severity: "low" },
  { phrase: "digital acceleration", replacement: "doing the same backlog faster", severity: "medium" }
] as const satisfies readonly CorporateFogFinding[];

const erpSignalRules = [
  {
    pattern: /\b(legacy|old|deprecated|temporary|workaround|custom field|mapping)\b/i,
    signal: "process sediment",
    reason: "The input hints at historical layers that probably became production by accident.",
    confidence: "high"
  },
  {
    pattern: /\b(SAP|Oracle|Dynamics|ERP|Fusion|Navision|AX)\b/i,
    signal: "enterprise system gravity",
    reason: "Named ERP systems usually mean the truth exists, but with table joins and emotional cost.",
    confidence: "high"
  },
  {
    pattern: /\b(invoice|supplier|vendor|customer|material|purchase order|PO)\b/i,
    signal: "master data dependency",
    reason: "Commercial objects are involved, so ownership is probably distributed across three teams and one spreadsheet.",
    confidence: "medium"
  },
  {
    pattern: /\b(spreadsheet|excel|csv|final_final|manual)\b/i,
    signal: "shadow production system",
    reason: "Manual files often carry the process truth that the official architecture diagram misplaced.",
    confidence: "high"
  }
] as const;

export function isAnttiMode(value: string): value is AnttiMode {
  return (ANTTI_MODES as readonly string[]).includes(value);
}

export function detectCorporateFog(input: string): string[] {
  return findCorporateFog(input).map((finding) => finding.phrase);
}

export function findCorporateFog(input: string): CorporateFogFinding[] {
  const lower = input.toLowerCase();
  return corporateFog.filter((entry) => lower.includes(entry.phrase));
}

export function banalize(input: string, intensity: AnttiIntensity = "default"): string {
  const findings = findCorporateFog(input);
  if (findings.length === 0) {
    return `We are trying to make ${plainObject(input)} less wrong.\n\nThere will be meetings.`;
  }

  const replacements = findings.map((finding) => `- ${finding.phrase} -> ${finding.replacement}`).join("\n");
  const escalation = intensity === "more-edge"
    ? "\n\nIf this continues, someone will create a maturity model."
    : intensity === "safe"
      ? "\n\nThe useful part is probably real. The wrapping can be smaller."
      : "\n\nThere will be meetings.";

  return `Ceremonial fog detected.\n\n${replacements}${escalation}`;
}

export function analyze(input: string): AgentAnalysis {
  const fog = findCorporateFog(input);
  const erpFindings = analyzeErp(input);
  const relations = relateDatapoints(input);
  const emotionalWeather = analyzeEmotionalWeather(input);
  const enterpriseGravity = analyzeEnterpriseGravity(input);

  return {
    fog,
    erpFindings,
    relations,
    emotionalWeather,
    enterpriseGravity,
    governance: buildGovernanceArtifact(input, fog, erpFindings),
    architecture: buildArchitectureArtifact(input),
    memeSuggestion: selectMemeTemplate(
      {
        gravitySignals: enterpriseGravity.map((g) => g.signal),
        emotionSignals: emotionalWeather.map((e) => e.signal)
      },
      extractMemeContext(input)
    )
  };
}

export function generate(req: AgentRequest): AgentResponse {
  const intensity = req.intensity ?? "default";
  const analysis = analyze(req.input);
  const warnings = analysis.fog.map(
    (finding) => `Detected ceremonial fog: "${finding.phrase}" -> "${finding.replacement}"`
  );

  const output = renderMode(req.mode, req.input, intensity, analysis, warnings);
  return { mode: req.mode, output, warnings, analysis };
}

function codecParamsFromIntensity(intensity: AnttiIntensity): {
  tone: SatireTone;
  safety: SatireSafety;
  format: SatireFormat;
} {
  if (intensity === "safe") {
    return { tone: "neutral", safety: "strict", format: "plain" };
  }
  if (intensity === "more-edge") {
    return { tone: "playful", safety: "balanced", format: "bullets" };
  }
  return { tone: "dry", safety: "strict", format: "plain" };
}

function renderMode(mode: AnttiMode, input: string, intensity: AnttiIntensity, analysis: AgentAnalysis, warnings: string[]): string {
  const edge = intensity === "more-edge";
  const safe = intensity === "safe";

  switch (mode) {
    case "desatirize": {
      const params = codecParamsFromIntensity(intensity);
      const result = transformText({ direction: "reduce", input, tone: params.tone, safety: params.safety, format: params.format });
      warnings.push(...result.warnings);
      return result.styledText;
    }
    case "satirize": {
      const params = codecParamsFromIntensity(intensity);
      const result = transformText({ direction: "induce", input, tone: params.tone, safety: params.safety, format: params.format });
      warnings.push(...result.warnings);
      return result.styledText;
    }
    case "codec": {
      const params = codecParamsFromIntensity(intensity);
      const result = transformText({ direction: "reduce", input, tone: params.tone, safety: params.safety, format: params.format });
      warnings.push(...result.warnings);
      return [
        `normalizedText: ${result.normalizedText}`,
        `styledText: ${result.styledText}`,
        `extractedFacts: ${result.extractedFacts.join(" | ")}`,
        `removedStyleMarkers: ${result.removedStyleMarkers.join(" | ")}`,
        `riskLabels: ${result.riskLabels.join(" | ")}`
      ].join("\n");
    }
    case "depress": {
      const result = compress(input);
      return `${result.compressed}\n\n${result.report}`;
    }
    case "plan": {
      return plan(input).report;
    }
    case "meme": {
      const m = analysis.memeSuggestion;
      return `Meme: ${m.memeName}\ntext0: ${m.text0}\ntext1: ${m.text1}\n\nRun with --json to get memeId for API captioning.`;
    }
    case "spec": {
      const planResult = plan(input);
      const doc = generateSpec(input, analysis, planResult.tasks, planResult.acceptanceCriteria);
      return formatSpec(doc);
    }
    case "banalizer":
      return banalize(input, intensity);
    case "archaeology":
      return renderArchaeology(input, analysis);
    case "diagnose":
      return renderDiagnosis(analysis);
    default:
      return `Mode not recognized. The request has been noted and will be discussed in a future alignment session.`;
  }
}

function analyzeErp(input: string): ErpFinding[] {
  const findings: ErpFinding[] = erpSignalRules
    .filter((rule) => rule.pattern.test(input))
    .map((rule) => ({ signal: rule.signal, reason: rule.reason, confidence: rule.confidence }));

  const fields = extractFieldLikeTokens(input);
  if (fields.length > 0) {
    findings.push({
      signal: `field archaeology: ${fields.slice(0, 4).join(", ")}`,
      reason: "Field-like tokens suggest undocumented semantics hiding in plain sight.",
      confidence: "medium"
    });
  }

  const years = input.match(/\b20\d{2}\b/g) ?? [];
  if (years.length > 0) {
    findings.push({
      signal: `timeline clue: ${unique(years).join(", ")}`,
      reason: "Explicit years are useful because process truth often follows reorgs, migrations, and temporary fixes that aged badly.",
      confidence: "medium"
    });
  }

  return dedupeBy(findings, (finding) => finding.signal);
}

function relateDatapoints(input: string): DatapointRelation[] {
  const tokens = extractBusinessTokens(input);
  const relations: DatapointRelation[] = [];

  for (let index = 0; index < tokens.length - 1 && relations.length < 4; index += 1) {
    const left = tokens[index];
    const right = tokens[index + 1];
    relations.push({
      left,
      right,
      hypothesis: `Check whether ${left} and ${right} are linked by an old mapping, merged master record, or reporting shortcut that became policy.`,
      confidence: index === 0 ? "medium" : "low"
    });
  }

  if (relations.length === 0 && /\b(supplier|vendor|customer|invoice|material)\b/i.test(input)) {
    relations.push({
      left: "business object",
      right: "process owner",
      hypothesis: "The likely relation is not technical first. It is ownership, naming, and who was allowed to change the value.",
      confidence: "medium"
    });
  }

  return relations;
}

function buildGovernanceArtifact(input: string, fog: CorporateFogFinding[], erpFindings: ErpFinding[]): GovernanceArtifact {
  const topic = plainObject(input);
  const risks = [
    fog.length > 0 ? "Language may hide the actual work behind transformation mist." : "The scope may become larger once people see the first useful output.",
    erpFindings.length > 0 ? "Historical system behavior may be treated as a defect instead of evidence." : "Decision ownership may be inferred from calendar invites, which is unsafe science."
  ];

  return {
    decision: `Proceed with ${topic}, but define who can say yes, who can say no, and who only attends because Outlook invited them.`,
    risks,
    actionPoints: [
      "Name the real owner of the data or decision.",
      "List the systems, files, and humans currently carrying the truth.",
      "Convert one ceremonial phrase into a testable outcome."
    ]
  };
}

function buildArchitectureArtifact(input: string): ArchitectureArtifact {
  const topic = titleCase(input);
  return {
    title: `${topic} operating sketch`,
    diagram: [
      "+----------------------+",
      "| Workplace input      |",
      "+----------+-----------+",
      "           |",
      "           v",
      "+----------------------+",
      "| Banalizer            |",
      "+----------+-----------+",
      "           |",
      "           v",
      "+----------------------+",
      "| ERP Archaeologist    |",
      "+----------+-----------+",
      "           |",
      "           v",
      "+----------------------+",
      "| Datapoint Relator    |",
      "+----------+-----------+",
      "           |",
      "           v",
      "+----------------------+",
      "| Usable dry output    |",
      "+----------------------+"
    ].join("\n"),
    realityCheck: "The boxes are clean. Reality will arrive through a country-specific exception and a spreadsheet with tenure."
  };
}

function renderArchaeology(input: string, _analysis: AgentAnalysis): string {
  const guide = buildArchaeologyGuide(input);
  const lines: string[] = [];

  lines.push(`Detected: ${guide.summary}.`);
  lines.push("");
  lines.push("The data is not wrong. It is historically correct in a way the current process no longer admits.");
  lines.push("");
  lines.push("Work through these phases. Each phase answer narrows what to look at next.");

  for (const phase of guide.phases) {
    lines.push("");
    lines.push(phase.name);
    for (const q of phase.questions) {
      lines.push(`  - ${q}`);
    }
    if (phase.systemHint) {
      lines.push(`  (${phase.systemHint})`);
    }
    if (phase.searchQueries.length > 0) {
      lines.push("");
      lines.push("  Search queries:");
      for (const q of phase.searchQueries) {
        lines.push(`    "${q}"`);
      }
    }
    if (phase.askUser.length > 0) {
      lines.push("");
      lines.push("  Ask the user:");
      for (const q of phase.askUser) {
        lines.push(`    - ${q}`);
      }
    }
  }

  return lines.join("\n");
}


function renderDiagnosis(analysis: AgentAnalysis): string {
  const sections = [
    ["Corporate fog", analysis.fog.map((finding) => `${finding.phrase} -> ${finding.replacement}`)],
    ["ERP archaeology", analysis.erpFindings.map((finding) => `${finding.signal}: ${finding.reason}`)],
    ["Suspicious relations", analysis.relations.map((relation) => `${relation.left} <-> ${relation.right}: ${relation.hypothesis}`)],
    [
      "Emotional weather",
      analysis.emotionalWeather.map((item) => {
        return `${item.signal} (${item.confidence}): ${item.hypothesis} Impact: ${item.operationalImpact} Evidence: ${item.evidence.join(", ")}`;
      })
    ],
    [
      "Enterprise gravity",
      analysis.enterpriseGravity.map((item) => {
        return `${item.signal} (${item.confidence}): ${item.observation} ${item.partnerSafeJoke} Impact: ${item.operationalImpact} Evidence: ${item.evidence.join(", ")}`;
      })
    ]
  ] as const;

  const body = sections
    .map(([title, rows]) => `${title}:\n${rows.length > 0 ? rows.map((row) => `- ${row}`).join("\n") : "- Nothing obvious. This is either fine or merely undocumented."}`)
    .join("\n\n");

  const m = analysis.memeSuggestion;
  const memeSection = `Meme suggestion:\n- ${m.memeName}: "${m.text0}" / "${m.text1}"`;

  return `${body}\n\n${memeSection}`;
}


function extractFieldLikeTokens(input: string): string[] {
  return unique(input.match(/\b[A-Z]{2,}[A-Z0-9_]{2,}\b/g) ?? []).filter((token) => token.length <= 32);
}

function extractBusinessTokens(input: string): string[] {
  const ids = input.match(/\b[A-Z]{1,5}[-_]?\d{2,}\b|\b\d{4,}\b/g) ?? [];
  const fieldTokens = extractFieldLikeTokens(input);
  return unique([...ids, ...fieldTokens]).slice(0, 6);
}

function plainObject(input: string): string {
  const trimmed = input.trim().replace(/[.!?]+$/, "");
  return trimmed || "the thing";
}

function titleCase(input: string): string {
  const text = plainObject(input);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function dedupeBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function runCodec(direction: SatireDirection, input: string, intensity: AnttiIntensity = "default") {
  const params = codecParamsFromIntensity(intensity);
  return transformText({
    direction,
    input,
    tone: params.tone,
    safety: params.safety,
    format: params.format
  });
}

export { compress as runCompress } from "./compress.js";
export { plan as runPlan } from "./plan.js";

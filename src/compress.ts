import { selectMemeFromCeremonyLabels, type MemeTemplate } from "./meme.js";

export interface CompressResult {
  original: string;
  compressed: string;
  originalWordCount: number;
  compressedWordCount: number;
  reductionPercent: number;
  removedSignal: string[];
  ceremonyIntact: boolean;
  report: string;
  memeSuggestion: MemeTemplate | null;
}

// Signal → vague ceremony equivalent. Strip the recoverable content, keep the performance.
const SIGNAL_STRIPPING_RULES: ReadonlyArray<{ source: string; flags: string; replacement: string; label: string }> = [
  { source: "\\b\\d+([.,]\\d+)?[%€$kKMB]?\\b", flags: "g", replacement: "significant", label: "number" },
  { source: "\\b[\\w./\\\\-]+\\.(?:ts|js|mjs|cjs|json|md|sql|py|csv|xlsx?|txt|log|env)\\b", flags: "gi", replacement: "the relevant component", label: "file reference" },
  { source: "\\b[A-Z][A-Z0-9_]{3,}\\b", flags: "g", replacement: "the relevant field", label: "technical identifier" },
  { source: "\\b(?:SAP|Oracle|Dynamics|Navision|Azure|Python|TypeScript|JavaScript|SQL|API|ERP|BI|ETL|DAX|Power ?BI|SharePoint|Teams|Excel|Git(?:Hub)?|Node\\.?js|npm|REST|GraphQL)\\b", flags: "gi", replacement: "the enterprise platform", label: "system name" },
];

// Plain language → inflate to ceremony. What was clear becomes strategic.
const INFLATION_CORPUS: ReadonlyArray<{ phrase: string; ceremony: string; label: string }> = [
  { phrase: "follow up", ceremony: "circle back", label: "jargon" },
  { phrase: "discuss separately", ceremony: "take this offline", label: "meeting euphemism" },
  { phrase: "make progress", ceremony: "move the needle", label: "metric theatre" },
  { phrase: "investigate", ceremony: "deep dive into", label: "intensity theatre" },
  { phrase: "coordination", ceremony: "synergy", label: "management fog" },
  { phrase: "coordinate", ceremony: "synergize", label: "management fog" },
  { phrase: "capacity", ceremony: "bandwidth", label: "tech-as-human theatre" },
  { phrase: "requirement", ceremony: "strategic enabler", label: "strategy fog" },
  { phrase: "source of truth", ceremony: "single source of truth", label: "data religion" },
  { phrase: "project", ceremony: "transformational journey", label: "transformation fog" },
  { phrase: "announcing", ceremony: "thrilled to announce", label: "emotion theatre" },
  { phrase: "use", ceremony: "leverage", label: "verb inflation" },
];

const CEREMONY_MARKERS = [
  "going forward", "moving forward", "touch base", "circle back", "leverage",
  "synerg", "bandwidth", "strategic", "transformational", "thrilled to announce",
  "in order to", "at this point in time", "best practice", "deep dive", "offline"
];

export function compress(input: string): CompressResult {
  const original = input.trim();
  const originalWordCount = countWords(original);

  const { text: compressed, removedSignal } = applyCompression(original);
  const compressedWordCount = countWords(compressed);

  const reductionPercent = originalWordCount > 0
    ? Math.round((1 - compressedWordCount / originalWordCount) * 100)
    : 0;

  const ceremonyIntact = checkCeremonyIntact(original, compressed);
  const report = buildReport(originalWordCount, compressedWordCount, reductionPercent, removedSignal, ceremonyIntact);
  const memeSuggestion = removedSignal.length > 0 ? selectMemeFromCeremonyLabels(removedSignal) : null;

  return {
    original,
    compressed,
    originalWordCount,
    compressedWordCount,
    reductionPercent,
    removedSignal,
    ceremonyIntact,
    report,
    memeSuggestion
  };
}

function applyCompression(input: string): { text: string; removedSignal: string[] } {
  let text = input;
  const removedSignal: string[] = [];

  for (const { source, flags, replacement, label } of SIGNAL_STRIPPING_RULES) {
    const regex = new RegExp(source, flags);
    if (regex.test(text)) {
      text = text.replace(new RegExp(source, flags), replacement);
      removedSignal.push(label);
    }
  }

  for (const { phrase, ceremony } of INFLATION_CORPUS) {
    const regex = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "gi");
    text = text.replace(regex, ceremony);
  }

  return { text: cleanupArtifacts(text), removedSignal: [...new Set(removedSignal)] };
}

function cleanupArtifacts(text: string): string {
  return text
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,.;:!?])\1+/g, "$1")
    .replace(/\.\s*\./g, ".")
    .replace(/,\s*\./g, ".")
    .trim();
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function checkCeremonyIntact(original: string, compressed: string): boolean {
  const originalLower = original.toLowerCase();
  const compressedLower = compressed.toLowerCase();
  const originalCeremony = CEREMONY_MARKERS.filter(m => originalLower.includes(m));
  if (originalCeremony.length === 0) return true;
  return originalCeremony.every(m => compressedLower.includes(m));
}

function buildReport(
  originalWordCount: number,
  compressedWordCount: number,
  reductionPercent: number,
  removedSignal: string[],
  ceremonyIntact: boolean
): string {
  const preview = removedSignal.slice(0, 3).join("; ") + (removedSignal.length > 3 ? "; and more" : "");

  const lines: string[] = [
    "Token Austerity Office report:",
    `Original: ${originalWordCount} words. Compressed: ${compressedWordCount} words. Reduction: ${reductionPercent}%.`,
    removedSignal.length > 0
      ? `Signal removed: ${removedSignal.length} type(s): ${preview}.`
      : "No signal detected. The input may already be purely ceremonial.",
    ceremonyIntact
      ? "Ceremony: intact."
      : "Ceremony: verify manually. Signal proximity may have disrupted ceremony.",
    reductionPercent === 0
      ? "Verdict: no reduction. Either pure ceremony arrived, or the signal was load-bearing."
      : reductionPercent < 10
        ? "Verdict: marginal. Signal was present but sparse."
        : reductionPercent < 25
          ? "Verdict: moderate. Signal successfully evaporated."
          : `Verdict: ${reductionPercent}% removed. The original contained significant operational content.`
  ];

  return lines.join("\n");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

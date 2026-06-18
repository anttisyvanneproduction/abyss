export interface MemeTemplate {
  memeId: string;
  memeName: string;
  text0: string;
  text1: string;
}

export interface MemeResult extends MemeTemplate {
  memeUrl: string | null;
  fallbackReason: string | null;
}

interface MemeMapping {
  signal: string;
  memeId: string;
  memeName: string;
  text0Template: string;
  text1Template: string;
}

// Signal-to-template map. Gravity signals checked first (more concrete).
const MEME_MAPPINGS: readonly MemeMapping[] = [
  {
    signal: "excel_as_production",
    memeId: "55311130",
    memeName: "This Is Fine",
    text0Template: "our {context} runs on Excel",
    text1Template: "this is fine"
  },
  {
    signal: "power_bi_semantic_dispute",
    memeId: "87743020",
    memeName: "Two Buttons",
    text0Template: "use finance's definition of {context}",
    text1Template: "use operations' definition of {context}"
  },
  {
    signal: "sharepoint_sprawl",
    memeId: "188390779",
    memeName: "Woman Yelling At Cat",
    text0Template: "where is the current version of {context}",
    text1Template: "SharePoint (four levels deep, folder renamed twice, possibly archived)"
  },
  {
    signal: "azure_landing_zone_theatre",
    memeId: "93895088",
    memeName: "Expanding Brain",
    text0Template: "deploy the app",
    text1Template: "deploy the app via landing zone with subscription hierarchy, policy assignment, and a 12-slide architecture review"
  },
  {
    signal: "teams_governance",
    memeId: "102156234",
    memeName: "Mocking Spongebob",
    text0Template: "the decision is documented somewhere in Teams",
    text1Template: "ThE dEcIsIoN iS dOcUmEnTeD sOmEwHeRe In TeAmS"
  },
  {
    signal: "entra_identity_fog",
    memeId: "101470",
    memeName: "Ancient Aliens",
    text0Template: "the {context} access policy",
    text1Template: "tenant boundaries"
  },
  {
    signal: "licensing_weather",
    memeId: "217743513",
    memeName: "UNO Draw 25 Cards",
    text0Template: "approve the licensing for {context}",
    text1Template: "draw 25 (renewal cycle, add-on review, reevaluate next quarter)"
  },
  {
    signal: "ownership_avoidance",
    memeId: "112126428",
    memeName: "Distracted Boyfriend",
    text0Template: "the actual owner of {context}",
    text1Template: "accountability for {context}"
  },
  {
    signal: "deadline_pressure",
    memeId: "131940431",
    memeName: "Gru's Plan",
    text0Template: "define scope / plan delivery / {context} goes live on time",
    text1Template: "{context} goes live on time"
  },
  {
    signal: "budget_anxiety",
    memeId: "217743513",
    memeName: "UNO Draw 25 Cards",
    text0Template: "approve the budget for {context}",
    text1Template: "draw 25 (procurement cycle, licensing review, reevaluate next quarter)"
  },
  {
    signal: "status_anxiety",
    memeId: "129242436",
    memeName: "Change My Mind",
    text0Template: "the steering group meeting is load-bearing for {context}",
    text1Template: "change my mind"
  },
  {
    signal: "change_fatigue",
    memeId: "4087833",
    memeName: "Waiting Skeleton",
    text0Template: "waiting for {context} adoption to reach critical mass",
    text1Template: "after the third rollout this year"
  },
  {
    signal: "trust_gap",
    memeId: "91538330",
    memeName: "X, X Everywhere",
    text0Template: "different definitions of {context}",
    text1Template: "different definitions of {context} everywhere"
  }
];

const FALLBACK: Omit<MemeMapping, "signal"> = {
  memeId: "61579",
  memeName: "One Does Not Simply",
  text0Template: "one does not simply {context}",
  text1Template: "without a steering group"
};

export interface MemeSignalInput {
  gravitySignals: string[];
  emotionSignals: string[];
}

export function selectMemeTemplate(signals: MemeSignalInput, context: string): MemeTemplate {
  // Gravity signals checked first (platform-specific, more concrete)
  const ordered = [...signals.gravitySignals, ...signals.emotionSignals];
  for (const mapping of MEME_MAPPINGS) {
    if (ordered.includes(mapping.signal)) {
      return interpolate(mapping, context);
    }
  }
  return interpolate(FALLBACK, context);
}

// Lightweight ceremony-label-based selection for compress output (no full analysis needed).
export function selectMemeFromCeremonyLabels(removedCeremony: string[]): MemeTemplate | null {
  if (removedCeremony.length === 0) return null;
  const labels = removedCeremony.join(" ").toLowerCase();

  if (/transformation fog|direction theatre/.test(labels)) {
    return interpolate(MEME_MAPPINGS.find((m) => m.signal === "deadline_pressure") ?? FALLBACK, "this project");
  }
  if (/management fog/.test(labels)) {
    return interpolate(MEME_MAPPINGS.find((m) => m.signal === "power_bi_semantic_dispute") ?? FALLBACK, "the strategy");
  }
  if (/emotion theatre/.test(labels)) {
    return interpolate(MEME_MAPPINGS.find((m) => m.signal === "change_fatigue") ?? FALLBACK, "the announcement");
  }
  // Generic high-ceremony
  return interpolate(MEME_MAPPINGS.find((m) => m.signal === "excel_as_production") ?? FALLBACK, "this document");
}

export async function generateMemeUrl(template: MemeTemplate): Promise<MemeResult> {
  const username = process.env["IMGFLIP_USERNAME"];
  const password = process.env["IMGFLIP_PASSWORD"];

  if (!username || !password) {
    return { ...template, memeUrl: null, fallbackReason: "IMGFLIP_USERNAME or IMGFLIP_PASSWORD not set" };
  }

  try {
    const body = new URLSearchParams({
      template_id: template.memeId,
      username,
      password,
      text0: template.text0,
      text1: template.text1
    });

    const response = await fetch("https://api.imgflip.com/caption_image", { method: "POST", body });

    if (!response.ok) {
      return { ...template, memeUrl: null, fallbackReason: `imgflip API returned ${response.status}` };
    }

    const json = await response.json() as { success: boolean; data?: { url: string }; error_message?: string };

    if (!json.success || !json.data?.url) {
      return { ...template, memeUrl: null, fallbackReason: json.error_message ?? "imgflip API returned success:false" };
    }

    return { ...template, memeUrl: json.data.url, fallbackReason: null };
  } catch (error) {
    return { ...template, memeUrl: null, fallbackReason: error instanceof Error ? error.message : "Network error" };
  }
}

export async function captionMeme(
  templateId: string,
  templateName: string,
  boxes: string[]
): Promise<MemeResult> {
  const username = process.env["IMGFLIP_USERNAME"];
  const password = process.env["IMGFLIP_PASSWORD"];

  if (!username || !password) {
    return { memeId: templateId, memeName: templateName, text0: boxes[0] ?? "", text1: boxes[1] ?? "", memeUrl: null, fallbackReason: "IMGFLIP_USERNAME or IMGFLIP_PASSWORD not set" };
  }

  try {
    const body = new URLSearchParams({ template_id: templateId, username, password });
    boxes.forEach((text, i) => body.set(`boxes[${i}][text]`, text));

    const response = await fetch("https://api.imgflip.com/caption_image", { method: "POST", body });
    if (!response.ok) {
      return { memeId: templateId, memeName: templateName, text0: boxes[0] ?? "", text1: boxes[1] ?? "", memeUrl: null, fallbackReason: `imgflip API returned ${response.status}` };
    }

    const json = await response.json() as { success: boolean; data?: { url: string }; error_message?: string };
    if (!json.success || !json.data?.url) {
      return { memeId: templateId, memeName: templateName, text0: boxes[0] ?? "", text1: boxes[1] ?? "", memeUrl: null, fallbackReason: json.error_message ?? "imgflip API returned success:false" };
    }

    return { memeId: templateId, memeName: templateName, text0: boxes[0] ?? "", text1: boxes[1] ?? "", memeUrl: json.data.url, fallbackReason: null };
  } catch (error) {
    return { memeId: templateId, memeName: templateName, text0: boxes[0] ?? "", text1: boxes[1] ?? "", memeUrl: null, fallbackReason: error instanceof Error ? error.message : "Network error" };
  }
}

export function formatMemeResult(result: MemeResult): string {
  const lines = [
    `Meme: ${result.memeName}`,
    `text0: ${result.text0}`,
    `text1: ${result.text1}`
  ];

  if (result.memeUrl) {
    lines.push(`URL: ${result.memeUrl}`);
  } else if (result.fallbackReason) {
    lines.push(`URL: (unavailable — ${result.fallbackReason})`);
  }

  return lines.join("\n");
}

function interpolate(mapping: Omit<MemeMapping, "signal">, context: string): MemeTemplate {
  return {
    memeId: mapping.memeId,
    memeName: mapping.memeName,
    text0: mapping.text0Template.replace(/\{context\}/g, context),
    text1: mapping.text1Template.replace(/\{context\}/g, context)
  };
}

// Stops at these words so context reads as a clean noun phrase.
const CONTEXT_STOP = /^(?:and|but|because|is|are|was|were|runs|still|that|which|where|using|with|on|in|to|a|an|also|will|has|have|had|does|do|did)$/i;
const CONTEXT_LEADING = /^(?:our|the|my|their|its|we|i|they|this|these|those|there)\s+/i;

export function extractMemeContext(input: string): string {
  const stripped = input.trim()
    .replace(/[.!?]+$/, "")
    .replace(CONTEXT_LEADING, "");

  const words = stripped.split(/\s+/);
  const kept: string[] = [];

  for (const word of words) {
    if (CONTEXT_STOP.test(word)) {
      if (kept.length === 0) continue; // skip leading stop words before any noun
      break;
    }
    kept.push(word);
    if (kept.length >= 3) break;
  }

  return kept.join(" ").toLowerCase() || "the thing";
}

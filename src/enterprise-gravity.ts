export type EnterpriseGravitySignal =
  | "excel_as_production"
  | "teams_governance"
  | "sharepoint_sprawl"
  | "power_bi_semantic_dispute"
  | "azure_landing_zone_theatre"
  | "entra_identity_fog"
  | "licensing_weather";

export interface EnterpriseGravityFinding {
  signal: EnterpriseGravitySignal;
  observation: string;
  partnerSafeJoke: string;
  operationalImpact: string;
  evidence: string[];
  confidence: "low" | "medium" | "high";
}

const rules: Array<{
  signal: EnterpriseGravitySignal;
  patterns: RegExp[];
  observation: string;
  partnerSafeJoke: string;
  operationalImpact: string;
  confidence: "low" | "medium" | "high";
}> = [
  {
    signal: "excel_as_production",
    patterns: [/\bexcel\b/i, /\bspreadsheet\b/i, /\b(xlsx|csv)\b/i, /\bfinal_final\b/i],
    observation: "Spreadsheet tooling appears to be carrying production meaning.",
    partnerSafeJoke: "Excel is not the villain. It is just very available, which in enterprise systems is how destiny starts.",
    operationalImpact: "Critical logic may live outside controlled deployment, lineage, and ownership paths.",
    confidence: "high"
  },
  {
    signal: "teams_governance",
    patterns: [/\bteams\b/i, /\bchannel\b/i, /\bmeeting chat\b/i],
    observation: "Teams may be acting as both communication layer and lightweight governance archive.",
    partnerSafeJoke: "Teams is excellent at preserving conversation, which is different from preserving decisions, but close enough to create confidence.",
    operationalImpact: "Decisions can become hard to find, especially after the channel name changes twice.",
    confidence: "medium"
  },
  {
    signal: "sharepoint_sprawl",
    patterns: [/\bsharepoint\b/i, /\bshared documents\b/i, /\bfolder\b/i, /\bdocument library\b/i],
    observation: "Document storage may be turning into process archaeology.",
    partnerSafeJoke: "SharePoint contains the document. The question is whether the document has chosen to reveal itself.",
    operationalImpact: "Teams may duplicate or misplace the current version of the truth.",
    confidence: "medium"
  },
  {
    signal: "power_bi_semantic_dispute",
    patterns: [/\bpower bi\b/i, /\bsemantic model\b/i, /\bdataset\b/i, /\bmeasure\b/i, /\bdax\b/i],
    observation: "A reporting definition may be carrying unresolved business semantics.",
    partnerSafeJoke: "Power BI can calculate the number. It cannot make two departments love the definition.",
    operationalImpact: "Dashboards may be correct in different ways, which is worse than being simply wrong.",
    confidence: "high"
  },
  {
    signal: "azure_landing_zone_theatre",
    patterns: [/\bazure\b/i, /\blanding zone\b/i, /\bsubscription\b/i, /\bresource group\b/i],
    observation: "Cloud architecture language may be hiding ownership and operating-model questions.",
    partnerSafeJoke: "Azure provides the landing zone. The organization still has to land, which is often the sporty part.",
    operationalImpact: "Platform decisions may look complete before support, cost, and ownership are clear.",
    confidence: "medium"
  },
  {
    signal: "entra_identity_fog",
    patterns: [/\bentra\b/i, /\bactive directory\b/i, /\baad\b/i, /\bidentity\b/i, /\btenant\b/i],
    observation: "Identity and tenant boundaries may be influencing architecture more than the diagram admits.",
    partnerSafeJoke: "Identity is where architecture discovers that people, apps, and tenants all have opinions.",
    operationalImpact: "Access, ownership, and lifecycle issues may appear late if identity is treated as plumbing.",
    confidence: "medium"
  },
  {
    signal: "licensing_weather",
    patterns: [/\blicens(e|ing)\b/i, /\bsku\b/i, /\bpremium\b/i, /\bprocurement\b/i, /\bcost\b/i],
    observation: "Licensing may be shaping the solution architecture.",
    partnerSafeJoke: "Licensing is not a blocker. It is weather with a price list.",
    operationalImpact: "The technically best option may be replaced by the option already approved by procurement.",
    confidence: "medium"
  }
];

export function analyzeEnterpriseGravity(input: string): EnterpriseGravityFinding[] {
  return rules
    .map((rule) => {
      const evidence = rule.patterns
        .map((pattern) => input.match(pattern)?.[0])
        .filter((match): match is string => Boolean(match));

      if (evidence.length === 0) {
        return undefined;
      }

      return {
        signal: rule.signal,
        observation: rule.observation,
        partnerSafeJoke: rule.partnerSafeJoke,
        operationalImpact: rule.operationalImpact,
        evidence: [...new Set(evidence)],
        confidence: evidence.length > 1 ? rule.confidence : downgrade(rule.confidence)
      } satisfies EnterpriseGravityFinding;
    })
    .filter((item): item is EnterpriseGravityFinding => Boolean(item));
}

function downgrade(confidence: "low" | "medium" | "high"): "low" | "medium" | "high" {
  if (confidence === "high") return "medium";
  if (confidence === "medium") return "low";
  return "low";
}
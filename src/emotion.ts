export type EmotionalWeatherSignal =
  | "trust_gap"
  | "status_anxiety"
  | "ownership_avoidance"
  | "deadline_pressure"
  | "budget_anxiety"
  | "change_fatigue";

export interface EmotionalWeatherHypothesis {
  signal: EmotionalWeatherSignal;
  hypothesis: string;
  operationalImpact: string;
  evidence: string[];
  confidence: "low" | "medium" | "high";
}

const rules: Array<{
  signal: EmotionalWeatherSignal;
  patterns: RegExp[];
  hypothesis: string;
  operationalImpact: string;
  confidence: "low" | "medium" | "high";
}> = [
  {
    signal: "trust_gap",
    patterns: [/\btrust\b/i, /\bverify\b/i, /\baudit\b/i, /\bsingle source of truth\b/i, /\breconcile\b/i],
    hypothesis: "Possible trust gap: people may not yet believe the same numbers mean the same thing.",
    operationalImpact: "Decisions may slow down while teams re-check data through unofficial channels.",
    confidence: "medium"
  },
  {
    signal: "status_anxiety",
    patterns: [/\bstakeholder\b/i, /\bvisibility\b/i, /\balignment\b/i, /\bsteering group\b/i, /\bexecutive\b/i],
    hypothesis: "Possible status anxiety: the work may need to look controlled before it is fully understood.",
    operationalImpact: "Communication may optimize for reassurance instead of clarity.",
    confidence: "medium"
  },
  {
    signal: "ownership_avoidance",
    patterns: [/\bowner\b/i, /\bownership\b/i, /\bRACI\b/i, /\bmandate\b/i, /\bdecision rights\b/i],
    hypothesis: "Possible ownership avoidance: the decision may be moving faster than the mandate.",
    operationalImpact: "Work can stall because everyone can comment but nobody can say yes.",
    confidence: "high"
  },
  {
    signal: "deadline_pressure",
    patterns: [/\bdeadline\b/i, /\bgo-live\b/i, /\blaunch\b/i, /\bthis quarter\b/i, /\bASAP\b/i],
    hypothesis: "Possible deadline pressure: time may be shaping the plan more than evidence is.",
    operationalImpact: "Teams may accept fragile shortcuts and call them phased delivery.",
    confidence: "medium"
  },
  {
    signal: "budget_anxiety",
    patterns: [/\bbudget\b/i, /\bcost\b/i, /\blicensing\b/i, /\bprocurement\b/i, /\bfree\b/i, /\b0 ?€\b/i],
    hypothesis: "Possible budget anxiety: the solution may need to be cheap enough to approve before it is good enough to trust.",
    operationalImpact: "Tool choices may be framed as strategy when they are actually procurement weather.",
    confidence: "medium"
  },
  {
    signal: "change_fatigue",
    patterns: [/\btransformation\b/i, /\bmigration\b/i, /\breorg\b/i, /\bnew operating model\b/i, /\brollout\b/i],
    hypothesis: "Possible change fatigue: the organization may understand the change and still be tired of being changed.",
    operationalImpact: "Adoption may depend less on training and more on whether people have any patience left.",
    confidence: "medium"
  }
];

export function analyzeEmotionalWeather(input: string): EmotionalWeatherHypothesis[] {
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
        hypothesis: rule.hypothesis,
        operationalImpact: rule.operationalImpact,
        evidence: [...new Set(evidence)],
        confidence: evidence.length > 1 ? rule.confidence : downgrade(rule.confidence)
      } satisfies EmotionalWeatherHypothesis;
    })
    .filter((item): item is EmotionalWeatherHypothesis => Boolean(item));
}

function downgrade(confidence: "low" | "medium" | "high"): "low" | "medium" | "high" {
  if (confidence === "high") return "medium";
  if (confidence === "medium") return "low";
  return "low";
}
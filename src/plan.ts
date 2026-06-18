import { extractMemeContext, selectMemeTemplate, type MemeTemplate } from "./meme.js";

export type PlanTaskStatus = "todo" | "doing" | "done" | "blocked by reality" | "waiting for governance oxygen";

export interface PlanTask {
  id: number;
  description: string;
  check: string;
  status: PlanTaskStatus;
}

export interface PlanResult {
  goal: string;
  scope: string[];
  tasks: PlanTask[];
  acceptanceCriteria: string[];
  proofNotPressStatus: "READY" | "NEEDS PROOF" | "SPEC THEATRE";
  totalTasks: number;
  memeSuggestion: MemeTemplate;
  report: string;
}

interface TaskRule {
  pattern: RegExp;
  description: (context: string) => string;
  check: string;
  scopeLabel: string;
  memeSignal?: string;
}

const TASK_RULES: readonly TaskRule[] = [
  {
    pattern: /\b(SAP|Oracle|Dynamics|ERP|Fusion|Navision|AX)\b/i,
    description: (ctx) => `Validate the current state of ${ctx} in the source ERP system.`,
    check: "Query returns consistent, documented results from the named ERP system.",
    scopeLabel: "ERP system validation",
    memeSignal: "excel_as_production"
  },
  {
    pattern: /\b(spreadsheet|excel|xlsx|csv|manual|final_final)\b/i,
    description: (ctx) => `Migrate ${ctx} from the manual source to a governed system.`,
    check: "The spreadsheet source can be deprecated; the governed system produces the same output.",
    scopeLabel: "Shadow system migration",
    memeSignal: "excel_as_production"
  },
  {
    pattern: /\b(align|stakeholder|sign.?off|approval|buy.?in)\b/i,
    description: (ctx) => `Get explicit sign-off on ${ctx} from the relevant decision-makers.`,
    check: "Sign-off is recorded in a ticket with approver name and date.",
    scopeLabel: "Stakeholder alignment",
    memeSignal: "ownership_avoidance"
  },
  {
    pattern: /\b(go.live|deadline|launch|release|cut.?off)\b/i,
    description: (ctx) => `Verify ${ctx} against the go-live checklist before the deadline.`,
    check: "Go-live checklist item has a pass/fail result linked from the project.",
    scopeLabel: "Go-live readiness",
    memeSignal: "deadline_pressure"
  },
  {
    pattern: /\b(owner|ownership|responsible|accountable|who owns)\b/i,
    description: (ctx) => `Identify and document the owner of ${ctx}.`,
    check: "Named owner is recorded in a ticket or decision log with date.",
    scopeLabel: "Ownership definition",
    memeSignal: "ownership_avoidance"
  },
  {
    pattern: /\b(mapping|field|column|schema|definition)\b/i,
    description: (ctx) => `Document the current field mapping and transformation logic for ${ctx}.`,
    check: "Mapping document exists at a known, linked path with column-level detail.",
    scopeLabel: "Field mapping documentation",
    memeSignal: "trust_gap"
  },
  {
    pattern: /\b(Power\s*BI|report|dashboard|analytics|semantic\s*model)\b/i,
    description: (ctx) => `Confirm the authoritative definition of the key metric in ${ctx}.`,
    check: "Metric definition is approved, documented, and referenced from the report.",
    scopeLabel: "Metric definition",
    memeSignal: "power_bi_semantic_dispute"
  },
  {
    pattern: /\b(SharePoint|Teams|channel|folder)\b/i,
    description: (ctx) => `Confirm the canonical location for ${ctx} documents and decisions.`,
    check: "One link points to the authoritative location and is shared with all stakeholders.",
    scopeLabel: "Document location",
    memeSignal: "sharepoint_sprawl"
  }
];

const BASE_TASKS: ReadonlyArray<{ description: (ctx: string) => string; check: string }> = [
  {
    description: (ctx) => `Define what done looks like for ${ctx} with at least one measurable check.`,
    check: "Acceptance criteria are written and reviewed before work starts."
  },
  {
    description: (ctx) => `Document the decision rationale and known constraints for ${ctx}.`,
    check: "Decision record exists at a known path and is linked from the project."
  }
];

export function plan(goalInput: string): PlanResult {
  const goal = extractGoal(goalInput);
  const context = shortenContext(goalInput);

  const matchedRules = TASK_RULES.filter((rule) => rule.pattern.test(goalInput));
  const scope = deriveScope(matchedRules, goalInput);

  const tasks: PlanTask[] = [];
  let id = 1;

  for (const rule of matchedRules) {
    tasks.push({ id: id++, description: rule.description(context), check: rule.check, status: "todo" });
  }

  for (const base of BASE_TASKS) {
    tasks.push({ id: id++, description: base.description(context), check: base.check, status: "todo" });
  }

  const acceptanceCriteria = buildAcceptanceCriteria(matchedRules, goalInput);
  const proofNotPressStatus = deriveProofStatus(tasks);

  const memeSignals = matchedRules
    .map((r) => r.memeSignal)
    .filter((s): s is string => s !== undefined);
  const memeSuggestion = selectMemeTemplate(
    { gravitySignals: memeSignals, emotionSignals: [] },
    extractMemeContext(goalInput)
  );

  const report = buildPlanReport(goal, tasks, acceptanceCriteria, proofNotPressStatus, memeSuggestion);

  return {
    goal,
    scope,
    tasks,
    acceptanceCriteria,
    proofNotPressStatus,
    totalTasks: tasks.length,
    memeSuggestion,
    report
  };
}

function extractGoal(input: string): string {
  const cleaned = input.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 120) return cleaned;
  const firstSentence = cleaned.match(/^[^.!?]+[.!?]/)?.[0];
  return firstSentence ?? cleaned.slice(0, 120).trim() + "...";
}

function shortenContext(input: string): string {
  // Prefer specific technical anchors over ceremony phrases
  const erpSystem = input.match(/\b(SAP|Oracle|Dynamics|ERP|Fusion|Navision|AX)\b/i)?.[0];
  const fileName = input.match(/\b[\w-]+\.(?:xlsx|csv|xls|json|xml|sql)\b/i)?.[0];
  const fieldCode = input.match(/\b[A-Z][A-Z0-9_]{3,}\b/)?.[0];

  if (erpSystem && fileName) return `${erpSystem} ${fileName}`;
  if (erpSystem) return `${erpSystem} mapping`;
  if (fileName) return fileName.toLowerCase();
  if (fieldCode) return fieldCode;

  // Fall back: strip preamble, prefer the clause after "because/since/due to"
  const stripped = input
    .trim()
    .replace(/^(?:we need to|i need to|please|could you|can you|help (?:us|me)|we have to|we must|we want to)\s+/i, "")
    .replace(/^(?:fix|resolve|update|change|create|make|build|add|remove|ensure|check|verify|validate|confirm|align|migrate|document|review|define|address|handle)\s+/i, "");

  const parts = stripped.split(/\b(?:because|since|due to|so that)\b/i);
  const chosen = (parts.length > 1 ? parts[1] : parts[0]).trim()
    .replace(/^(?:the|a|an|our|their|this|that)\s+/i, "");

  return chosen.split(/\s+/).slice(0, 4).join(" ").toLowerCase().replace(/[.!?,;]$/, "") || "the work item";
}

function deriveScope(rules: readonly TaskRule[], input: string): string[] {
  const scope = rules.map((r) => r.scopeLabel);
  if (/\btest|verify|check|validate\b/i.test(input)) scope.push("Verification");
  if (/\bdoc|document|spec\b/i.test(input)) scope.push("Documentation");
  if (scope.length === 0) scope.push("Define the actual work", "Identify constraints");
  return [...new Set(scope)];
}

function buildAcceptanceCriteria(rules: readonly TaskRule[], input: string): string[] {
  const criteria: string[] = [];

  if (rules.some((r) => /shadow system|spreadsheet/i.test(r.scopeLabel))) {
    criteria.push("No production process relies on a manually maintained spreadsheet.");
  }
  if (rules.some((r) => /ERP|field mapping/i.test(r.scopeLabel))) {
    criteria.push("All system mappings are documented at field level and linked from the project.");
  }
  if (rules.some((r) => /stakeholder|alignment/i.test(r.scopeLabel))) {
    criteria.push("Decision-maker sign-off is documented with name and date.");
  }
  if (rules.some((r) => /go.live|readiness/i.test(r.scopeLabel))) {
    criteria.push("Go-live checklist is complete with no open blockers.");
  }
  if (rules.some((r) => /metric|Power BI/i.test(r.scopeLabel))) {
    criteria.push("The key metric has one agreed definition visible in the report.");
  }
  if (rules.some((r) => /ownership/i.test(r.scopeLabel))) {
    criteria.push("Every work item has a named owner, not a team name.");
  }

  criteria.push(
    "Every task has a testable check before the plan is considered proof, not press.",
    "The plan remains useful if a steering group discovers it."
  );

  return criteria;
}

function deriveProofStatus(tasks: readonly PlanTask[]): "READY" | "NEEDS PROOF" | "SPEC THEATRE" {
  const withChecks = tasks.filter((t) => t.check.trim().length > 0).length;
  if (withChecks === 0) return "SPEC THEATRE";
  if (withChecks < tasks.length) return "NEEDS PROOF";
  return "READY";
}

function buildPlanReport(
  goal: string,
  tasks: readonly PlanTask[],
  acceptanceCriteria: readonly string[],
  proofStatus: string,
  meme: MemeTemplate
): string {
  const taskLines = tasks
    .map((t) => `${t.id}. [ ] ${t.description}\n   check: ${t.check}`)
    .join("\n\n");

  const criteriaLines = acceptanceCriteria.map((c) => `- ${c}`).join("\n");

  const statusNote = proofStatus === "READY"
    ? `Proof-not-press: READY. All ${tasks.length} tasks have testable checks.`
    : proofStatus === "NEEDS PROOF"
      ? "Proof-not-press: NEEDS PROOF. Some tasks still lack verifiable checks."
      : "Proof-not-press: SPEC THEATRE. No tasks have checks. Add evidence before calling this a plan.";

  return [
    `Goal: ${goal}`,
    "",
    "Tasks:",
    taskLines,
    "",
    "Acceptance criteria:",
    criteriaLines,
    "",
    statusNote,
    "",
    `Meme suggestion: ${meme.memeName} — "${meme.text0}" / "${meme.text1}"`
  ].join("\n");
}

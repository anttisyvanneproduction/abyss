import { addNode, addEdge } from "./knowledge-graph.js";
import type { KnowledgeNode, KnowledgeEdge, NodeType, Priority, Effort, TaskStatus } from "./knowledge-graph.js";

export interface IngestResult {
  source: string;
  meetingNodeId: string | null;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  stats: {
    lines: number;
    tasks: number;
    decisions: number;
    blockers: number;
    people: number;
  };
}

// Inline tag patterns: [priority: high], [effort: m], [milestone: Sprint 1]
const INLINE_PRIORITY_RE = /\[priority:\s*(high|medium|low)\]/i;
const INLINE_EFFORT_RE = /\[effort:\s*(xs|s|m|l|xl)\]/i;
const INLINE_MILESTONE_RE = /\[milestone:\s*([^\]]+)\]/i;

// Assignment patterns in a task line
const ASSIGNEE_RE = /(?:assigned?\s+to|owner|responsible)\s*[:\s]+@?([\w][\w\s]*?)(?=[,\n\[]|$)/gi;
const PERSON_MENTION_RE = /@([\w][\w.-]*)/g;

// Node-type extraction line patterns
const TASK_RE = /^(?:[-*]\s+\[[ ]\]|TODO|ACTION|TASK|AP)\s*:?\s+(.+)$/i;
const DONE_TASK_RE = /^[-*]\s+\[x\]\s+(.+)$/i;
const DECISION_RE = /^(?:DECISION|DECIDED|AGREED|RESOLUTION)\s*:\s*(.+)$/i;
const BLOCKER_RE = /^(?:BLOCKER|BLOCKED|IMPEDIMENT|DEPENDENCY)\s*:\s*(.+)$/i;
const RISK_RE = /^RISK\s*:\s*(.+)$/i;
const HEADING_RE = /^#{1,2}\s+(.+)$/;

function stripInlineTags(text: string): string {
  return text
    .replace(INLINE_PRIORITY_RE, "")
    .replace(INLINE_EFFORT_RE, "")
    .replace(INLINE_MILESTONE_RE, "")
    .replace(ASSIGNEE_RE, "")
    .trim();
}

function extractInlineMeta(line: string): {
  priority?: Priority;
  effort?: Effort;
  milestone?: string;
} {
  const priority = (line.match(INLINE_PRIORITY_RE)?.[1]?.toLowerCase() as Priority | undefined);
  const effort = (line.match(INLINE_EFFORT_RE)?.[1]?.toLowerCase() as Effort | undefined);
  const milestone = line.match(INLINE_MILESTONE_RE)?.[1]?.trim();
  return { priority, effort, milestone };
}

export function ingestDocument(
  text: string,
  source: string,
  graphPath = ".abyss/knowledge-graph.json"
): IngestResult {
  const lines = text.split("\n");
  const createdNodes: KnowledgeNode[] = [];
  const createdEdges: KnowledgeEdge[] = [];
  const people = new Map<string, KnowledgeNode>();

  function ensurePerson(name: string): KnowledgeNode {
    const key = name.toLowerCase().trim();
    if (!people.has(key)) {
      const n = addNode(
        { type: "person", label: name.trim(), body: "", source, tags: ["person"] },
        graphPath
      );
      people.set(key, n);
      createdNodes.push(n);
    }
    return people.get(key)!;
  }

  function link(from: string, to: string, relation: KnowledgeEdge["relation"]): void {
    const edge: KnowledgeEdge = { from, to, relation };
    addEdge(edge, graphPath);
    createdEdges.push(edge);
  }

  // Create a meeting node for the document
  const titleLine = lines.find((l) => HEADING_RE.test(l));
  const title = titleLine ? (titleLine.match(HEADING_RE)?.[1] ?? source) : source;
  const meetingNode = addNode(
    { type: "meeting", label: title, body: text.slice(0, 500).trim(), source, tags: ["meeting"] },
    graphPath
  );
  createdNodes.push(meetingNode);

  // Parse @mentions from the full document to ensure all people are created
  for (const [, name] of text.matchAll(PERSON_MENTION_RE)) {
    ensurePerson(name);
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Done task
    const doneMatch = trimmed.match(DONE_TASK_RE);
    if (doneMatch) {
      const raw = doneMatch[1];
      const meta = extractInlineMeta(raw);
      const label = stripInlineTags(raw);
      const node = addNode(
        { type: "task", label, body: trimmed, status: "done" as TaskStatus, source, tags: ["task"], ...meta },
        graphPath
      );
      createdNodes.push(node);
      link(node.id, meetingNode.id, "identified_in");
      continue;
    }

    // Open task
    const taskMatch = trimmed.match(TASK_RE);
    if (taskMatch) {
      const raw = taskMatch[1];
      const meta = extractInlineMeta(raw);
      const label = stripInlineTags(raw);
      const node = addNode(
        { type: "task", label, body: trimmed, status: "open" as TaskStatus, source, tags: ["task"], ...meta },
        graphPath
      );
      createdNodes.push(node);
      link(node.id, meetingNode.id, "identified_in");

      // Detect assignees from the full raw line
      for (const [, name] of trimmed.matchAll(ASSIGNEE_RE)) {
        const person = ensurePerson(name.trim());
        link(node.id, person.id, "assigned_to");
      }
      // Also detect @mentions in task line as potential assignees when "assigned to" pattern not found
      const assigneeMatches = [...trimmed.matchAll(ASSIGNEE_RE)];
      if (assigneeMatches.length === 0) {
        for (const [, name] of trimmed.matchAll(PERSON_MENTION_RE)) {
          const person = ensurePerson(name);
          link(node.id, person.id, "assigned_to");
        }
      }
      continue;
    }

    // Decision
    const decMatch = trimmed.match(DECISION_RE);
    if (decMatch) {
      const node = addNode(
        { type: "decision", label: decMatch[1].trim(), body: trimmed, source, tags: ["decision"] },
        graphPath
      );
      createdNodes.push(node);
      link(node.id, meetingNode.id, "decided_in");
      continue;
    }

    // Risk
    const riskMatch = trimmed.match(RISK_RE);
    if (riskMatch) {
      const node = addNode(
        { type: "risk", label: riskMatch[1].trim(), body: trimmed, source, tags: ["risk"] },
        graphPath
      );
      createdNodes.push(node);
      link(node.id, meetingNode.id, "identified_in");
      continue;
    }

    // Blocker
    const blockerMatch = trimmed.match(BLOCKER_RE);
    if (blockerMatch) {
      const node = addNode(
        { type: "blocker", label: blockerMatch[1].trim(), body: trimmed, source, tags: ["blocker"] },
        graphPath
      );
      createdNodes.push(node);
      link(node.id, meetingNode.id, "identified_in");
      continue;
    }
  }

  return {
    source,
    meetingNodeId: meetingNode.id,
    nodes: createdNodes,
    edges: createdEdges,
    stats: {
      lines: lines.length,
      tasks: createdNodes.filter((n) => n.type === "task").length,
      decisions: createdNodes.filter((n) => n.type === "decision").length,
      blockers: createdNodes.filter((n) => n.type === "blocker" || n.type === "risk").length,
      people: people.size,
    },
  };
}

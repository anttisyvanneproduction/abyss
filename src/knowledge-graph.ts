import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

export type NodeType = "task" | "decision" | "person" | "meeting" | "blocker" | "risk" | "context";
export type EdgeRelation = "assigned_to" | "depends_on" | "blocks" | "relates_to" | "identified_in" | "decided_in" | "follows_from";
export type TaskStatus = "open" | "in_progress" | "done" | "deferred" | "cancelled";
export type Priority = "high" | "medium" | "low";
export type Effort = "xs" | "s" | "m" | "l" | "xl";

export interface KnowledgeNode {
  id: string;
  type: NodeType;
  label: string;
  body: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  effort?: Effort;
  milestone?: string;
  source?: string;
  created: string;
  tags: string[];
}

export interface KnowledgeEdge {
  from: string;
  to: string;
  relation: EdgeRelation;
}

export interface KnowledgeGraph {
  version: number;
  nodes: Record<string, KnowledgeNode>;
  edges: KnowledgeEdge[];
}

export type NodePatch = Partial<Omit<KnowledgeNode, "id" | "created">>;

export interface QueryOpts {
  query?: string;
  type?: NodeType;
  status?: TaskStatus;
  priority?: Priority;
  milestone?: string;
  tag?: string;
}

const DEFAULT_PATH = ".antti/knowledge-graph.json";

function load(path: string): KnowledgeGraph {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as KnowledgeGraph;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: 1, nodes: {}, edges: [] };
    }
    throw e;
  }
}

function save(path: string, graph: KnowledgeGraph): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(graph, null, 2), "utf8");
}

export function addNode(
  node: Omit<KnowledgeNode, "id" | "created">,
  path = DEFAULT_PATH
): KnowledgeNode {
  const graph = load(path);
  const full: KnowledgeNode = { ...node, id: randomUUID(), created: new Date().toISOString() };
  graph.nodes[full.id] = full;
  save(path, graph);
  return full;
}

export function addEdge(edge: KnowledgeEdge, path = DEFAULT_PATH): void {
  const graph = load(path);
  // Avoid duplicate edges
  const exists = graph.edges.some(
    (e) => e.from === edge.from && e.to === edge.to && e.relation === edge.relation
  );
  if (!exists) graph.edges.push(edge);
  save(path, graph);
}

export function queryNodes(opts: QueryOpts, path = DEFAULT_PATH): KnowledgeNode[] {
  const graph = load(path);
  const all = Object.values(graph.nodes);
  return all.filter((n) => {
    if (opts.type && n.type !== opts.type) return false;
    if (opts.status && n.status !== opts.status) return false;
    if (opts.priority && n.priority !== opts.priority) return false;
    if (opts.milestone && n.milestone !== opts.milestone) return false;
    if (opts.tag && !n.tags.includes(opts.tag)) return false;
    if (opts.query) {
      const needle = opts.query.toLowerCase();
      const hay = [n.label, n.body, n.milestone ?? "", ...n.tags].join(" ").toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

export function getRelated(
  nodeId: string,
  path = DEFAULT_PATH
): { node: KnowledgeNode; relation: EdgeRelation; direction: "out" | "in" }[] {
  const graph = load(path);
  const results: { node: KnowledgeNode; relation: EdgeRelation; direction: "out" | "in" }[] = [];
  for (const edge of graph.edges) {
    if (edge.from === nodeId && graph.nodes[edge.to]) {
      results.push({ node: graph.nodes[edge.to], relation: edge.relation, direction: "out" });
    }
    if (edge.to === nodeId && graph.nodes[edge.from]) {
      results.push({ node: graph.nodes[edge.from], relation: edge.relation, direction: "in" });
    }
  }
  return results;
}

export function updateNode(
  nodeId: string,
  patch: NodePatch,
  path = DEFAULT_PATH
): KnowledgeNode | null {
  const graph = load(path);
  const node = graph.nodes[nodeId];
  if (!node) return null;
  Object.assign(node, patch);
  save(path, graph);
  return node;
}

export function getGraph(path = DEFAULT_PATH): KnowledgeGraph {
  return load(path);
}

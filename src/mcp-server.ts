import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { addContextMemory, searchMemory } from "./memory.js";
import { captionMeme } from "./meme.js";
import { fetchMemeTemplates } from "./meme-templates.js";
import { queryNodes, updateNode, getGraph } from "./knowledge-graph.js";
import { ingestDocument } from "./document-ingest.js";
import { toMermaid, toDot, toHtml } from "./knowledge-graph-viz.js";
import type { NodeType, TaskStatus, Priority } from "./knowledge-graph.js";

export function createAnttiMcpServer(): McpServer {
  const server = new McpServer({
    name: "abyss-stack",
    version: "0.1.0"
  });

  server.registerTool(
    "get_meme_templates",
    {
      title: "get_meme_templates — list imgflip popular meme templates",
      description:
        "Fetches the top 100 popular meme templates from imgflip.com/popular-meme-ids. Returns id, name, and alternate names for each. Use this to browse available templates before calling caption_meme. Results are cached for the session.",
      inputSchema: {}
    },
    async () => {
      const templates = await fetchMemeTemplates();
      return jsonTool({ templates });
    }
  );

  server.registerTool(
    "caption_meme",
    {
      title: "caption_meme — generate captioned meme via imgflip API",
      description:
        "Captions a meme template with the provided text boxes and returns the URL and inline image. Requires IMGFLIP_USERNAME and IMGFLIP_PASSWORD env vars. Call get_meme_templates first to find the right template_id. boxes is an array of caption strings — match the count to the template (most templates use 2 boxes, some use 3–5).",
      inputSchema: {
        template_id: z.string().min(1).describe("imgflip template ID from get_meme_templates"),
        template_name: z.string().min(1).describe("template name for labelling the result"),
        boxes: z.array(z.string().min(1)).min(1).max(20).describe("caption text for each box in order")
      }
    },
    async ({ template_id, template_name, boxes }) => {
      const result = await captionMeme(template_id, template_name, boxes);

      const content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> = [
        { type: "text", text: JSON.stringify(result, null, 2) }
      ];

      if (result.memeUrl) {
        try {
          const imgResponse = await fetch(result.memeUrl);
          const buffer = await imgResponse.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          content.push({ type: "image", data: base64, mimeType: "image/jpeg" });
        } catch {
          // image fetch failed — URL is still in the JSON above
        }
      }

      return { content };
    }
  );

  server.registerTool(
    "memory_search",
    {
      title: "memory_search — retrieve stored context",
      description: "Search local JSONL memory by keyword. Defaults to .abyss/memory.jsonl.",
      inputSchema: {
        query: z.string().min(1),
        path: z.string().default(".abyss/memory.jsonl")
      }
    },
    ({ query, path }) => jsonTool({ records: searchMemory(path, query) })
  );

  server.registerTool(
    "memory_add",
    {
      title: "memory_add — store context",
      description:
        "Store a note, observation, or finding in local JSONL memory. Text is compressed before storage to keep the file lean. Returns what was stored and compression stats.",
      inputSchema: {
        text: z.string().min(1),
        source: z.string().optional(),
        category: z.enum(["corporate_fog", "enterprise_gravity", "emotional_weather", "erp_archaeology", "decision_fossils", "satire_fixtures", "reviewer_notes", "general"]).optional(),
        path: z.string().default(".abyss/memory.jsonl")
      }
    },
    ({ text, source, category, path }) => jsonTool(
      addContextMemory({ path, text, source, category: category as Parameters<typeof addContextMemory>[0]["category"] })
    )
  );

  // ─── Knowledge graph tools ──────────────────────────────────────────────────

  const NODE_TYPE_ENUM = z.enum(["task", "decision", "person", "meeting", "blocker", "risk", "context"]);
  const TASK_STATUS_ENUM = z.enum(["open", "in_progress", "done", "deferred", "cancelled"]);
  const PRIORITY_ENUM = z.enum(["high", "medium", "low"]);
  const EFFORT_ENUM = z.enum(["xs", "s", "m", "l", "xl"]);
  const GRAPH_PATH = z.string().default(".abyss/knowledge-graph.json");

  server.registerTool(
    "knowledge_ingest",
    {
      title: "knowledge_ingest — parse a document into the knowledge graph",
      description:
        "Parses meeting notes, decisions, or any freeform document and extracts tasks, decisions, blockers, risks, and people into the local knowledge graph. Returns extracted nodes and stats. Supports inline tags: [priority: high], [effort: m], [milestone: Sprint 1].",
      inputSchema: {
        document: z.string().min(1).describe("Raw document text (meeting notes, emails, etc.)"),
        source: z.string().min(1).describe("Short label for the source (e.g. 'kickoff-2026-06-06')"),
        graph_path: GRAPH_PATH.describe("Path to knowledge graph JSON file")
      }
    },
    ({ document, source, graph_path }) => {
      const result = ingestDocument(document, source, graph_path);
      return jsonTool({
        source: result.source,
        meetingNodeId: result.meetingNodeId,
        stats: result.stats,
        nodes: result.nodes,
        edges: result.edges
      });
    }
  );

  server.registerTool(
    "knowledge_query",
    {
      title: "knowledge_query — search the knowledge graph",
      description:
        "Query the knowledge graph by keyword, node type, task status, priority, milestone, or tag. Returns matching nodes.",
      inputSchema: {
        query: z.string().optional().describe("Keyword to search label, body, and tags"),
        type: NODE_TYPE_ENUM.optional().describe("Filter by node type"),
        status: TASK_STATUS_ENUM.optional().describe("Filter by task status"),
        priority: PRIORITY_ENUM.optional().describe("Filter by priority"),
        milestone: z.string().optional().describe("Filter by milestone name"),
        tag: z.string().optional().describe("Filter by tag"),
        graph_path: GRAPH_PATH
      }
    },
    ({ query, type, status, priority, milestone, tag, graph_path }) =>
      jsonTool(queryNodes({ query, type: type as NodeType, status: status as TaskStatus, priority: priority as Priority, milestone, tag }, graph_path))
  );

  server.registerTool(
    "knowledge_tasks",
    {
      title: "knowledge_tasks — list tasks from the knowledge graph",
      description:
        "Lists task nodes from the knowledge graph, enriched with assignees and related context. Defaults to open tasks.",
      inputSchema: {
        status: TASK_STATUS_ENUM.optional().default("open").describe("Task status to filter (default: open)"),
        milestone: z.string().optional().describe("Filter by milestone"),
        priority: PRIORITY_ENUM.optional().describe("Filter by priority"),
        graph_path: GRAPH_PATH
      }
    },
    ({ status, milestone, priority, graph_path }) => {
      const graph = getGraph(graph_path);
      const tasks = queryNodes(
        { type: "task", status: status as TaskStatus, milestone, priority: priority as Priority },
        graph_path
      );

      const enriched = tasks.map((t) => {
        const assignees = graph.edges
          .filter((e) => e.from === t.id && e.relation === "assigned_to")
          .map((e) => graph.nodes[e.to])
          .filter(Boolean)
          .map((n) => n.label);
        const sources = graph.edges
          .filter((e) => e.from === t.id && e.relation === "identified_in")
          .map((e) => graph.nodes[e.to])
          .filter(Boolean)
          .map((n) => n.label);
        return { ...t, assignees, identifiedIn: sources };
      });

      return jsonTool({ count: enriched.length, tasks: enriched });
    }
  );

  server.registerTool(
    "knowledge_task_update",
    {
      title: "knowledge_task_update — update a task's planning fields",
      description:
        "Update status, priority, due date, effort, milestone, label, or body of a single task node. Pass only the fields you want to change.",
      inputSchema: {
        node_id: z.string().min(1).describe("Task node ID from knowledge_tasks or knowledge_query"),
        status: TASK_STATUS_ENUM.optional(),
        priority: PRIORITY_ENUM.optional(),
        due_date: z.string().optional().describe("ISO date YYYY-MM-DD"),
        effort: EFFORT_ENUM.optional(),
        milestone: z.string().optional(),
        label: z.string().optional(),
        body: z.string().optional(),
        graph_path: GRAPH_PATH
      }
    },
    ({ node_id, status, priority, due_date, effort, milestone, label, body, graph_path }) => {
      const patch: Record<string, unknown> = {};
      if (status !== undefined) patch.status = status;
      if (priority !== undefined) patch.priority = priority;
      if (due_date !== undefined) patch.dueDate = due_date;
      if (effort !== undefined) patch.effort = effort;
      if (milestone !== undefined) patch.milestone = milestone;
      if (label !== undefined) patch.label = label;
      if (body !== undefined) patch.body = body;

      const updated = updateNode(node_id, patch, graph_path);
      if (!updated) return jsonTool({ error: `Node ${node_id} not found` });
      return jsonTool({ updated });
    }
  );

  server.registerTool(
    "knowledge_task_plan",
    {
      title: "knowledge_task_plan — batch-assign tasks to a sprint or milestone",
      description:
        "Batch-update multiple task nodes at once — assign them to a milestone, set priority, or change status. Useful for sprint planning.",
      inputSchema: {
        node_ids: z.array(z.string().min(1)).min(1).describe("List of task node IDs to update"),
        milestone: z.string().optional().describe("Assign to this milestone / sprint"),
        priority: PRIORITY_ENUM.optional(),
        status: TASK_STATUS_ENUM.optional(),
        graph_path: GRAPH_PATH
      }
    },
    ({ node_ids, milestone, priority, status, graph_path }) => {
      const patch: Record<string, unknown> = {};
      if (milestone !== undefined) patch.milestone = milestone;
      if (priority !== undefined) patch.priority = priority;
      if (status !== undefined) patch.status = status;

      const results = node_ids.map((id) => {
        const updated = updateNode(id, patch, graph_path);
        return { id, updated: updated !== null };
      });

      const succeeded = results.filter((r) => r.updated).length;
      return jsonTool({ updated: succeeded, notFound: results.filter((r) => !r.updated).map((r) => r.id) });
    }
  );

  server.registerTool(
    "knowledge_visualize",
    {
      title: "knowledge_visualize — visualize the knowledge graph",
      description:
        'Visualize the knowledge graph. Format "mermaid" returns a Mermaid flowchart (Claude renders natively). Format "dot" returns Graphviz DOT. Format "html" writes a self-contained HTML file with a D3 force graph and Kanban board, then returns the output path.',
      inputSchema: {
        format: z.enum(["mermaid", "dot", "html"]).default("mermaid").describe("Output format"),
        filter_type: NODE_TYPE_ENUM.optional().describe("Only include nodes of this type"),
        filter_status: TASK_STATUS_ENUM.optional().describe("Only include nodes with this status"),
        output_path: z.string().default(".abyss/graph-view.html").describe("Output path for HTML format"),
        graph_path: GRAPH_PATH
      }
    },
    ({ format, filter_type, filter_status, output_path, graph_path }) => {
      const graph = getGraph(graph_path);
      const opts = {
        filterType: filter_type as NodeType | undefined,
        filterStatus: filter_status as TaskStatus | undefined
      };

      if (format === "html") {
        const html = toHtml(graph, opts);
        mkdirSync(dirname(output_path), { recursive: true });
        writeFileSync(output_path, html, "utf8");
        return jsonTool({
          output_path,
          open_command: `start "${output_path}"`,
          note: "HTML file written. Open in a browser to view the force graph and Kanban board."
        });
      }

      const text = format === "dot" ? toDot(graph, opts) : toMermaid(graph, opts);
      return {
        content: [{ type: "text" as const, text }]
      };
    }
  );

  return server;
}

function jsonTool(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

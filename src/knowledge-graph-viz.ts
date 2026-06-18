import type { KnowledgeGraph, KnowledgeNode, NodeType, TaskStatus } from "./knowledge-graph.js";

export interface VizOpts {
  filterType?: NodeType;
  filterStatus?: TaskStatus;
}

// ─── Mermaid ──────────────────────────────────────────────────────────────────

const MERMAID_SHAPE: Record<NodeType, [string, string]> = {
  task:     ["[",  "]"],
  decision: ["{",  "}"],
  person:   ["([", "])"],
  meeting:  ["[[", "]]"],
  blocker:  [">",  "]"],
  risk:     [">",  "]"],
  context:  ["(",  ")"],
};

function safeMermaidId(id: string): string {
  return `n_${id.replace(/-/g, "_")}`;
}

function truncate(s: string, max = 40): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export function toMermaid(graph: KnowledgeGraph, opts: VizOpts = {}): string {
  const nodes = Object.values(graph.nodes).filter((n) => {
    if (opts.filterType && n.type !== opts.filterType) return false;
    if (opts.filterStatus && n.status !== opts.filterStatus) return false;
    return true;
  });
  const nodeIds = new Set(nodes.map((n) => n.id));

  const lines: string[] = ["flowchart LR"];

  for (const n of nodes) {
    const [open, close] = MERMAID_SHAPE[n.type];
    const label = truncate(n.label);
    lines.push(`  ${safeMermaidId(n.id)}${open}"${label}"${close}`);
  }

  for (const e of graph.edges) {
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) continue;
    const label = e.relation.replace(/_/g, " ");
    lines.push(`  ${safeMermaidId(e.from)} -->|${label}| ${safeMermaidId(e.to)}`);
  }

  return lines.join("\n");
}

// ─── DOT (Graphviz) ───────────────────────────────────────────────────────────

const DOT_SHAPE: Record<NodeType, string> = {
  task:     "box",
  decision: "diamond",
  person:   "ellipse",
  meeting:  "rectangle",
  blocker:  "trapezium",
  risk:     "invtrapezium",
  context:  "note",
};

export function toDot(graph: KnowledgeGraph, opts: VizOpts = {}): string {
  const nodes = Object.values(graph.nodes).filter((n) => {
    if (opts.filterType && n.type !== opts.filterType) return false;
    if (opts.filterStatus && n.status !== opts.filterStatus) return false;
    return true;
  });
  const nodeIds = new Set(nodes.map((n) => n.id));

  const lines: string[] = [`digraph knowledge_graph {`, `  rankdir=LR;`, `  node [fontname="Arial"];`];

  for (const n of nodes) {
    const shape = DOT_SHAPE[n.type];
    const label = truncate(n.label, 50).replace(/"/g, '\\"');
    lines.push(`  "${n.id}" [label="${label}", shape=${shape}];`);
  }

  for (const e of graph.edges) {
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) continue;
    const label = e.relation.replace(/_/g, " ");
    lines.push(`  "${e.from}" -> "${e.to}" [label="${label}"];`);
  }

  lines.push("}");
  return lines.join("\n");
}

// ─── HTML (D3 force graph + Kanban board) ─────────────────────────────────────

const TYPE_COLORS: Record<NodeType, string> = {
  task:     "#4f93ce",
  decision: "#e08f2e",
  person:   "#6abd6e",
  meeting:  "#9b69c4",
  blocker:  "#e05a5a",
  risk:     "#e0aa2e",
  context:  "#7abac4",
};

const PRIORITY_BADGE: Record<string, string> = {
  high:   "background:#e05a5a;color:#fff",
  medium: "background:#e0aa2e;color:#fff",
  low:    "background:#6abd6e;color:#fff",
};

const EFFORT_LABEL: Record<string, string> = { xs: "XS", s: "S", m: "M", l: "L", xl: "XL" };

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function taskCard(n: KnowledgeNode, assigneeNames: string[]): string {
  const priority = n.priority
    ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;${PRIORITY_BADGE[n.priority]}">${n.priority.toUpperCase()}</span> `
    : "";
  const effort = n.effort ? `<span style="font-size:10px;padding:1px 5px;border-radius:3px;background:#dde;color:#446">${EFFORT_LABEL[n.effort]}</span> ` : "";
  const due = n.dueDate ? `<span style="font-size:10px;color:#888">📅 ${n.dueDate}</span>` : "";
  const milestone = n.milestone ? `<div style="font-size:10px;color:#777;margin-top:2px">🏁 ${escHtml(n.milestone)}</div>` : "";
  const assignees = assigneeNames.length
    ? `<div style="font-size:10px;color:#555;margin-top:3px">👤 ${assigneeNames.map(escHtml).join(", ")}</div>`
    : "";

  return `<div style="background:#fff;border:1px solid #ddd;border-radius:5px;padding:8px;margin-bottom:6px;box-shadow:0 1px 2px rgba(0,0,0,.06)">
      <div style="font-size:13px;font-weight:500;margin-bottom:4px">${escHtml(truncate(n.label, 60))}</div>
      <div>${priority}${effort}${due}</div>
      ${milestone}${assignees}
    </div>`;
}

export function toHtml(graph: KnowledgeGraph, opts: VizOpts = {}): string {
  const allNodes = Object.values(graph.nodes);
  const visNodes = allNodes.filter((n) => {
    if (opts.filterType && n.type !== opts.filterType) return false;
    if (opts.filterStatus && n.status !== opts.filterStatus) return false;
    return true;
  });
  const nodeIds = new Set(visNodes.map((n) => n.id));

  const visEdges = graph.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));

  // Build assignee lookup for tasks
  function assigneeNames(taskId: string): string[] {
    return graph.edges
      .filter((e) => e.from === taskId && e.relation === "assigned_to")
      .map((e) => graph.nodes[e.to]?.label ?? "")
      .filter(Boolean);
  }

  // Kanban: tasks only, grouped by milestone within each status column
  const kanbanStatuses = ["open", "in_progress", "done", "deferred"] as const;
  const kanbanLabels: Record<string, string> = {
    open: "Open", in_progress: "In Progress", done: "Done", deferred: "Deferred"
  };
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2, "": 3 };

  function kanbanColumn(status: string): string {
    const tasks = allNodes
      .filter((n) => n.type === "task" && n.status === status)
      .sort((a, b) => (priorityOrder[a.priority ?? ""] ?? 3) - (priorityOrder[b.priority ?? ""] ?? 3));

    const byMilestone = new Map<string, KnowledgeNode[]>();
    for (const t of tasks) {
      const key = t.milestone ?? "__none__";
      if (!byMilestone.has(key)) byMilestone.set(key, []);
      byMilestone.get(key)!.push(t);
    }

    let html = "";
    for (const [ms, items] of byMilestone) {
      if (ms !== "__none__") {
        html += `<div style="font-size:11px;font-weight:600;color:#8b5cf6;margin:8px 0 4px;text-transform:uppercase;letter-spacing:.05em">🏁 ${escHtml(ms)}</div>`;
      }
      for (const t of items) {
        html += taskCard(t, assigneeNames(t.id));
      }
    }

    return `<div style="min-width:220px;max-width:260px;background:#f8f8fa;border-radius:8px;padding:10px">
      <div style="font-weight:700;font-size:14px;margin-bottom:10px;color:#333">${kanbanLabels[status]} <span style="font-weight:400;color:#999">${tasks.length}</span></div>
      ${html || '<div style="color:#bbb;font-size:12px;text-align:center;padding:20px 0">Empty</div>'}
    </div>`;
  }

  const graphJson = JSON.stringify({
    nodes: visNodes.map((n) => ({ id: n.id, label: truncate(n.label, 30), type: n.type, color: TYPE_COLORS[n.type] })),
    edges: visEdges.map((e) => ({ source: e.from, target: e.to, label: e.relation.replace(/_/g, " ") })),
  });

  const legend = (Object.entries(TYPE_COLORS) as [NodeType, string][])
    .map(([t, c]) => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:10px"><span style="width:10px;height:10px;border-radius:50%;background:${c};display:inline-block"></span>${t}</span>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Knowledge Graph</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #f0f2f5; color: #222; }
  #tabs { display: flex; gap: 4px; padding: 12px 16px 0; }
  .tab-btn { padding: 8px 18px; border: none; border-radius: 6px 6px 0 0; cursor: pointer; font-size: 14px; font-weight: 500; background: #dde; color: #556; }
  .tab-btn.active { background: #fff; color: #222; box-shadow: 0 -1px 3px rgba(0,0,0,.1); }
  #panel-force, #panel-kanban { display: none; background: #fff; border-radius: 0 6px 6px 6px; min-height: 80vh; }
  #panel-force.visible, #panel-kanban.visible { display: block; }
  #force-container { position: relative; }
  svg { width: 100%; height: 80vh; display: block; }
  .link { stroke: #aaa; stroke-width: 1.2; fill: none; }
  .link-label { font-size: 10px; fill: #888; pointer-events: none; }
  .node circle { stroke: #fff; stroke-width: 2; cursor: pointer; }
  .node text { font-size: 11px; pointer-events: none; fill: #222; }
  #legend { position: absolute; top: 10px; left: 10px; background: rgba(255,255,255,.9); border-radius: 6px; padding: 8px 12px; font-size: 11px; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
  #kanban-board { display: flex; gap: 12px; padding: 16px; overflow-x: auto; align-items: flex-start; }
</style>
</head>
<body>
<div id="tabs">
  <button class="tab-btn active" onclick="switchTab('force')">Force Graph</button>
  <button class="tab-btn" onclick="switchTab('kanban')">Kanban Board</button>
</div>

<div id="panel-force" class="visible">
  <div id="force-container">
    <div id="legend">${legend}</div>
    <svg id="svg"></svg>
  </div>
</div>

<div id="panel-kanban">
  <div id="kanban-board">
    ${kanbanStatuses.map(kanbanColumn).join("\n    ")}
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
<script>
const graphData = ${graphJson};

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', ['force','kanban'][i] === name));
  document.getElementById('panel-force').classList.toggle('visible', name === 'force');
  document.getElementById('panel-kanban').classList.toggle('visible', name === 'kanban');
  if (name === 'force' && !window._d3init) initD3();
}

function initD3() {
  window._d3init = true;
  const svg = d3.select('#svg');
  const rect = document.getElementById('svg').getBoundingClientRect();
  const W = rect.width || 900, H = rect.height || 600;

  const g = svg.append('g');

  svg.call(d3.zoom().scaleExtent([0.1, 5]).on('zoom', (ev) => g.attr('transform', ev.transform)));

  // Arrow marker
  svg.append('defs').append('marker')
    .attr('id', 'arrow').attr('viewBox', '0 -5 10 10').attr('refX', 18).attr('refY', 0)
    .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
    .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', '#aaa');

  const sim = d3.forceSimulation(graphData.nodes)
    .force('link', d3.forceLink(graphData.edges).id(d => d.id).distance(120))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(30));

  const link = g.append('g').selectAll('line')
    .data(graphData.edges).join('line')
    .attr('class', 'link').attr('marker-end', 'url(#arrow)');

  const linkLabel = g.append('g').selectAll('text')
    .data(graphData.edges).join('text')
    .attr('class', 'link-label').text(d => d.label);

  const node = g.append('g').selectAll('g')
    .data(graphData.nodes).join('g')
    .attr('class', 'node')
    .call(d3.drag()
      .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
      .on('end', (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

  node.append('circle').attr('r', 12).attr('fill', d => d.color);
  node.append('text').attr('dy', 22).attr('text-anchor', 'middle').text(d => d.label);
  node.append('title').text(d => d.label + ' (' + d.type + ')');

  sim.on('tick', () => {
    link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
    linkLabel.attr('x', d => (d.source.x + d.target.x) / 2).attr('y', d => (d.source.y + d.target.y) / 2);
    node.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
  });
}

// Init force graph on first load
initD3();
</script>
</body>
</html>`;
}

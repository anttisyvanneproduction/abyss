import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["dist/mcp.js"],
  cwd: process.cwd(),
  stderr: "pipe"
});

const client = new Client({ name: "abyss-stack-smoke", version: "0.1.0" });
await client.connect(transport);

const tools = await client.listTools();
const names = tools.tools.map((tool) => tool.name).sort();
const required = [
  "caption_meme",
  "get_meme_templates",
  "knowledge_ingest",
  "knowledge_query",
  "knowledge_task_plan",
  "knowledge_task_update",
  "knowledge_tasks",
  "knowledge_visualize",
  "memory_add",
  "memory_search"
];

for (const name of required) {
  if (!names.includes(name)) {
    throw new Error(`Missing MCP tool: ${name}`);
  }
}

const result = await client.callTool({
  name: "memory_search",
  arguments: {
    query: "smoke test"
  }
});

const text = result.content?.[0]?.type === "text" ? result.content[0].text : "";
if (!text.includes("records")) {
  throw new Error("MCP memory_search result did not include expected field.");
}

await client.close();
console.log(`MCP smoke passed with ${names.length} tools: ${names.join(", ")}`);

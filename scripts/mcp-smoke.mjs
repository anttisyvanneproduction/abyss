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
  "archaeology",
  "casing",
  "data_platform",
  "depress",
  "emotional_weather",
  "enterprise_gravity",
  "generate_meme",
  "generate_spec",
  "memory_add",
  "memory_search",
  "plan"
];

for (const name of required) {
  if (!names.includes(name)) {
    throw new Error(`Missing MCP tool: ${name}`);
  }
}

const result = await client.callTool({
  name: "enterprise_gravity",
  arguments: {
    input: "Power BI definitions live in Excel before go-live."
  }
});

const text = result.content?.[0]?.type === "text" ? result.content[0].text : "";
if (!text.includes("enterpriseGravity")) {
  throw new Error("MCP enterprise_gravity result did not include expected field.");
}

await client.close();
console.log(`MCP smoke passed with ${names.length} tools.`);

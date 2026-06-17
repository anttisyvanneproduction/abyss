import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createAnttiMcpServer } from "./mcp-server.js";

const server = createAnttiMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);

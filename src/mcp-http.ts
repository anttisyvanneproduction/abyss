import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createAnttiMcpServer } from "./mcp-server.js";

const PORT = Number(process.env.MCP_HTTP_PORT ?? 3000);
const HOST = process.env.MCP_HTTP_HOST ?? "127.0.0.1";

// createMcpExpressApp applies DNS rebinding protection for localhost hosts by default
const app = createMcpExpressApp({ host: HOST });

app.post("/mcp", async (req: import("express").Request, res: import("express").Response) => {
  const server = createAnttiMcpServer();
  try {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("close", () => {
      transport.close();
      server.close();
    });
  } catch {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null
      });
    }
  }
});

// GET /mcp returns tool list for discovery (clients that support it)
app.get("/mcp", async (req: import("express").Request, res: import("express").Response) => {
  const server = createAnttiMcpServer();
  try {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res);
    res.on("close", () => {
      transport.close();
      server.close();
    });
  } catch {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null
      });
    }
  }
});

app.listen(PORT, HOST, () => {
  process.stderr.write(`abyss-stack MCP HTTP listening on http://${HOST}:${PORT}/mcp\n`);
  process.stderr.write(`Set MCP_HTTP_HOST=0.0.0.0 to allow remote connections.\n`);
});

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

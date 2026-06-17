import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT ?? 4173);
const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"]
]);

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const file = normalize(join(root, requested));

  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end("No corporate shortcuts.");
    return;
  }

  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types.get(extname(file)) ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found. Probably moved to a new Teams channel.");
  }
}).listen(port, () => {
  console.log(`Abyss Stack website running at http://127.0.0.1:${port}`);
});
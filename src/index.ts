import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { loadEnv } from "./env.js";
import { PocketBaseClient } from "./client.js";
import { registerAll } from "./tools/index.js";

async function main() {
  const cfg = loadEnv();
  const client = new PocketBaseClient(cfg);

  // Bootstrap: authenticate eagerly so misconfig fails fast.
  await client.bootstrap();

  const server = new McpServer({
    name: "pocketbase-mcp",
    version: "0.1.0",
  });

  registerAll(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // eslint-disable-next-line no-console
  console.error("[pocketbase-mcp] ready on stdio");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[pocketbase-mcp] fatal:", err);
  process.exit(1);
});

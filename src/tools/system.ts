import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { PocketBaseClient } from "../client.js";

export function register(server: McpServer, client: PocketBaseClient): void {
  server.registerTool(
    "health_check",
    {
      description: "Check the PocketBase API health status. No auth required.",
      inputSchema: z.object({}),
    },
    async () => {
      const res = await client.request("GET", "/api/health", { skipAuth: true });
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );
}

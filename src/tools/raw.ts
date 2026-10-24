import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { PocketBaseClient } from "../client.js";

export function register(server: McpServer, client: PocketBaseClient): void {
  server.registerTool(
    "raw_request",
    {
      description:
        "Send a raw HTTP request to any PocketBase API endpoint. Use this for endpoints not covered by other tools (e.g. Realtime, SQL, custom routes). Provide method, path, and optional query/body/headers.",
      inputSchema: z.object({
        method: z.enum(["GET", "POST", "PATCH", "PUT", "DELETE"]),
        path: z.string().startsWith("/").describe('API path, e.g. "/api/sql".'),
        query: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
          .optional()
          .describe("Query parameters."),
        body: z
          .unknown()
          .optional()
          .describe("Request body (will be JSON-encoded)."),
        headers: z
          .record(z.string(), z.string())
          .optional()
          .describe("Custom headers (Authorization is added automatically)."),
      }),
    },
    async ({ method, path, query, body, headers }) => {
      const res = await client.request(method, path, { query, body, headers });
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );
}

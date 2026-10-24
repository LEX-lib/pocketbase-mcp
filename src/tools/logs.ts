import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { PocketBaseClient } from "../client.js";
import { fieldsSchema, filterSchema, paginationSchema, sortSchema } from "../schema/common.js";

export function register(server: McpServer, client: PocketBaseClient): void {
  server.registerTool(
    "list_logs",
    {
      description:
        "List request logs. Superuser only. Supports pagination, filtering, and sorting.",
      inputSchema: z.object({
        ...paginationSchema.shape,
        filter: filterSchema,
        sort: sortSchema,
        fields: fieldsSchema,
      }),
    },
    async (params) => {
      const res = await client.request("GET", "/api/logs", { query: params });
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "get_log",
    {
      description: "Get a single log entry by ID. Superuser only.",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }) => {
      const res = await client.request("GET", `/api/logs/${id}`);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "log_stats",
    {
      description:
        "Get hourly aggregated log statistics. Superuser only. Supports filtering.",
      inputSchema: z.object({ filter: filterSchema, fields: fieldsSchema }),
    },
    async (params) => {
      const res = await client.request("GET", "/api/logs/stats", { query: params });
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "truncate_logs",
    {
      description: "Delete all logs. Superuser only.",
      inputSchema: z.object({}),
    },
    async () => {
      await client.request("DELETE", "/api/logs");
      return { content: [{ type: "text", text: "All logs truncated." }] };
    },
  );
}

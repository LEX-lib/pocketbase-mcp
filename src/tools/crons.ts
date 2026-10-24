import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { PocketBaseClient } from "../client.js";
import { fieldsSchema } from "../schema/common.js";

export function register(server: McpServer, client: PocketBaseClient): void {
  server.registerTool(
    "list_crons",
    {
      description: "List all registered cron jobs. Superuser only.",
      inputSchema: z.object({ fields: fieldsSchema }),
    },
    async ({ fields }) => {
      const res = await client.request("GET", "/api/crons", { query: { fields } });
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "run_cron",
    {
      description: "Manually trigger a cron job by its ID. Superuser only.",
      inputSchema: z.object({ jobId: z.string() }),
    },
    async ({ jobId }) => {
      await client.request("POST", `/api/crons/${jobId}`);
      return { content: [{ type: "text", text: `Cron job ${jobId} triggered.` }] };
    },
  );
}

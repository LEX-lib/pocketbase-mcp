import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { PocketBaseClient } from "../client.js";
import { collectionIdOrNameSchema, recordIdSchema } from "../schema/common.js";

export function register(server: McpServer, client: PocketBaseClient): void {
  server.registerTool(
    "get_file_token",
    {
      description:
        "Generate a short-lived file access token for accessing protected files. Superuser only.",
      inputSchema: z.object({}),
    },
    async () => {
      const res = await client.request<{ token: string }>("POST", "/api/files/token");
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "build_file_url",
    {
      description:
        "Build a public file URL for a record's file field. Files are served at /api/files/:collection/:recordId/:filename.",
      inputSchema: z.object({
        collection: collectionIdOrNameSchema,
        recordId: recordIdSchema,
        filename: z.string().describe("Filename from the record's file field."),
        token: z
          .string()
          .optional()
          .describe("Optional file token for protected files."),
      }),
    },
    async ({ collection, recordId, filename, token }) => {
      const baseUrl = client.baseUrl;
      let url = `${baseUrl}/api/files/${collection}/${recordId}/${filename}`;
      if (token) url += `?token=${token}`;
      return { content: [{ type: "text", text: url }] };
    },
  );
}

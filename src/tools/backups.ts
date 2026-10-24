import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { PocketBaseClient } from "../client.js";
import { fieldsSchema } from "../schema/common.js";

export function register(server: McpServer, client: PocketBaseClient): void {
  server.registerTool(
    "list_backups",
    {
      description: "List all available backup files. Superuser only.",
      inputSchema: z.object({ fields: fieldsSchema }),
    },
    async ({ fields }) => {
      const res = await client.request("GET", "/api/backups", { query: { fields } });
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "create_backup",
    {
      description:
        "Create a new backup. Optionally provide a custom name (must be [a-z0-9_-].zip). Superuser only.",
      inputSchema: z.object({
        name: z
          .string()
          .regex(/^[a-z0-9_-]+\.zip$/)
          .optional()
          .describe("Optional backup filename."),
      }),
    },
    async ({ name }) => {
      await client.request("POST", "/api/backups", { body: { name } });
      return { content: [{ type: "text", text: "Backup created." }] };
    },
  );

  server.registerTool(
    "delete_backup",
    {
      description: "Delete a backup by key. Superuser only.",
      inputSchema: z.object({ key: z.string() }),
    },
    async ({ key }) => {
      await client.request("DELETE", `/api/backups/${key}`);
      return { content: [{ type: "text", text: `Deleted backup ${key}.` }] };
    },
  );

  server.registerTool(
    "restore_backup",
    {
      description:
        "Restore a backup by key and restart PocketBase. Superuser only. WARNING: This overwrites all current data.",
      inputSchema: z.object({ key: z.string() }),
    },
    async ({ key }) => {
      await client.request("POST", `/api/backups/${key}/restore`);
      return {
        content: [
          {
            type: "text",
            text: `Backup ${key} restored. PocketBase is restarting.`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_backup_download_url",
    {
      description:
        "Generate a download URL for a backup file (requires superuser file token).",
      inputSchema: z.object({ key: z.string() }),
    },
    async ({ key }) => {
      const tokenRes = await client.request<{ token: string }>(
        "POST",
        "/api/files/token",
      );
      const url = `${client.baseUrl}/api/backups/${key}?token=${tokenRes.token}`;
      return { content: [{ type: "text", text: url }] };
    },
  );

  server.registerTool(
    "upload_backup",
    {
      description:
        "Upload an existing backup zip file. Superuser only. Provide the file as base64 or a local path (if running locally).",
      inputSchema: z.object({
        fileBase64: z
          .string()
          .optional()
          .describe("Base64-encoded zip file content."),
        filePath: z
          .string()
          .optional()
          .describe("Local file path (if running the server locally)."),
      }),
    },
    async ({ fileBase64, filePath }) => {
      if (!fileBase64 && !filePath) {
        return {
          content: [
            { type: "text", text: "Error: Provide either fileBase64 or filePath." },
          ],
          isError: true,
        };
      }

      let fileBuffer: Buffer;
      if (fileBase64) {
        fileBuffer = Buffer.from(fileBase64, "base64");
      } else {
        const fs = await import("node:fs/promises");
        fileBuffer = await fs.readFile(filePath!);
      }

      const form = new FormData();
      form.set(
        "file",
        new Blob([fileBuffer], { type: "application/zip" }),
        "backup.zip",
      );

      await client.request("POST", "/api/backups/upload", { body: form });
      return { content: [{ type: "text", text: "Backup uploaded." }] };
    },
  );
}

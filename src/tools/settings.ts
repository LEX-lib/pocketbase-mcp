import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { PocketBaseClient } from "../client.js";
import { fieldsSchema } from "../schema/common.js";

export function register(server: McpServer, client: PocketBaseClient): void {
  server.registerTool(
    "get_settings",
    {
      description:
        "Get all application settings (SMTP, S3, backups, meta, rate limits, etc.). Secrets are redacted. Superuser only.",
      inputSchema: z.object({ fields: fieldsSchema }),
    },
    async ({ fields }) => {
      const res = await client.request("GET", "/api/settings", { query: { fields } });
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "update_settings",
    {
      description:
        "Update application settings. Provide only the fields you want to change. Superuser only.",
      inputSchema: z.object({
        meta: z
          .object({
            appName: z.string().optional(),
            appUrl: z.string().optional(),
            senderName: z.string().optional(),
            senderAddress: z.string().optional(),
            hideControls: z.boolean().optional(),
          })
          .optional(),
        logs: z
          .object({
            maxDays: z.number().int().optional(),
            minLevel: z.number().int().optional(),
            logIP: z.boolean().optional(),
            logAuthId: z.boolean().optional(),
          })
          .optional(),
        backups: z
          .object({
            cron: z.string().optional(),
            cronMaxKeep: z.number().int().optional(),
          })
          .optional(),
        smtp: z
          .object({
            enabled: z.boolean().optional(),
            host: z.string().optional(),
            port: z.number().int().optional(),
            username: z.string().optional(),
            password: z.string().optional(),
            tls: z.boolean().optional(),
            authMethod: z.string().optional(),
          })
          .optional(),
        batch: z
          .object({
            enabled: z.boolean().optional(),
            maxRequests: z.number().int().optional(),
            timeout: z.number().int().optional(),
          })
          .optional(),
      }),
    },
    async (body) => {
      const res = await client.request("PATCH", "/api/settings", { body });
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "test_email",
    {
      description:
        "Send a test email (verification, password-reset, or email-change template). Superuser only.",
      inputSchema: z.object({
        email: z.string().email(),
        template: z.enum(["verification", "password-reset", "email-change"]),
        collection: z.string().optional().describe("Auth collection name (defaults to _superusers)."),
      }),
    },
    async ({ email, template, collection }) => {
      await client.request("POST", "/api/settings/test/email", {
        body: { email, template, collection },
      });
      return { content: [{ type: "text", text: `Test email sent to ${email}.` }] };
    },
  );

  server.registerTool(
    "test_s3",
    {
      description:
        "Test S3 storage connection (storage or backups filesystem). Superuser only.",
      inputSchema: z.object({
        filesystem: z.enum(["storage", "backups"]),
      }),
    },
    async ({ filesystem }) => {
      await client.request("POST", "/api/settings/test/s3", {
        body: { filesystem },
      });
      return {
        content: [{ type: "text", text: `S3 test passed for ${filesystem}.` }],
      };
    },
  );
}

import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { PocketBaseClient } from "../client.js";
import { collectionIdOrNameSchema, expandSchema } from "../schema/common.js";

export function register(server: McpServer, client: PocketBaseClient): void {
  server.registerTool(
    "list_auth_methods",
    {
      description:
        "List allowed authentication methods for an auth collection (password, OAuth2, MFA, OTP).",
      inputSchema: z.object({ collection: collectionIdOrNameSchema }),
    },
    async ({ collection }) => {
      const res = await client.request(
        "GET",
        `/api/collections/${collection}/auth-methods`,
      );
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "auth_with_password",
    {
      description:
        "Authenticate a user in an auth collection with email/username + password. Returns token and record.",
      inputSchema: z.object({
        collection: collectionIdOrNameSchema,
        identity: z.string().describe("Email or username."),
        password: z.string(),
        expand: expandSchema,
      }),
    },
    async ({ collection, identity, password, expand }) => {
      const res = await client.request(
        "POST",
        `/api/collections/${collection}/auth-with-password`,
        { body: { identity, password }, query: { expand } },
      );
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "impersonate_user",
    {
      description:
        "Impersonate an auth record (superuser only). Returns a non-refreshable token for that user.",
      inputSchema: z.object({
        collection: collectionIdOrNameSchema,
        id: z.string().describe("Auth record ID to impersonate."),
        duration: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Optional token duration in seconds."),
      }),
    },
    async ({ collection, id, duration }) => {
      const res = await client.request(
        "POST",
        `/api/collections/${collection}/impersonate/${id}`,
        { body: { duration } },
      );
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "request_verification",
    {
      description: "Send email verification request to an auth record.",
      inputSchema: z.object({
        collection: collectionIdOrNameSchema,
        email: z.string().email(),
      }),
    },
    async ({ collection, email }) => {
      await client.request(
        "POST",
        `/api/collections/${collection}/request-verification`,
        { body: { email } },
      );
      return { content: [{ type: "text", text: "Verification email sent." }] };
    },
  );

  server.registerTool(
    "confirm_verification",
    {
      description: "Confirm email verification with the token from the email.",
      inputSchema: z.object({
        collection: collectionIdOrNameSchema,
        token: z.string(),
      }),
    },
    async ({ collection, token }) => {
      await client.request(
        "POST",
        `/api/collections/${collection}/confirm-verification`,
        { body: { token } },
      );
      return { content: [{ type: "text", text: "Email verified." }] };
    },
  );

  server.registerTool(
    "request_password_reset",
    {
      description: "Send password reset email to an auth record.",
      inputSchema: z.object({
        collection: collectionIdOrNameSchema,
        email: z.string().email(),
      }),
    },
    async ({ collection, email }) => {
      await client.request(
        "POST",
        `/api/collections/${collection}/request-password-reset`,
        { body: { email } },
      );
      return { content: [{ type: "text", text: "Password reset email sent." }] };
    },
  );

  server.registerTool(
    "confirm_password_reset",
    {
      description: "Confirm password reset with token and new password.",
      inputSchema: z.object({
        collection: collectionIdOrNameSchema,
        token: z.string(),
        password: z.string(),
        passwordConfirm: z.string(),
      }),
    },
    async ({ collection, token, password, passwordConfirm }) => {
      await client.request(
        "POST",
        `/api/collections/${collection}/confirm-password-reset`,
        { body: { token, password, passwordConfirm } },
      );
      return { content: [{ type: "text", text: "Password reset confirmed." }] };
    },
  );

  server.registerTool(
    "request_email_change",
    {
      description: "Request email change for an authenticated record.",
      inputSchema: z.object({
        collection: collectionIdOrNameSchema,
        newEmail: z.string().email(),
      }),
    },
    async ({ collection, newEmail }) => {
      await client.request(
        "POST",
        `/api/collections/${collection}/request-email-change`,
        { body: { newEmail } },
      );
      return { content: [{ type: "text", text: "Email change request sent." }] };
    },
  );

  server.registerTool(
    "confirm_email_change",
    {
      description: "Confirm email change with token and password.",
      inputSchema: z.object({
        collection: collectionIdOrNameSchema,
        token: z.string(),
        password: z.string(),
      }),
    },
    async ({ collection, token, password }) => {
      await client.request(
        "POST",
        `/api/collections/${collection}/confirm-email-change`,
        { body: { token, password } },
      );
      return { content: [{ type: "text", text: "Email change confirmed." }] };
    },
  );
}

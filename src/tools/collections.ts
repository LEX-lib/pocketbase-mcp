import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { PocketBaseClient } from "../client.js";
import {
  collectionIdOrNameSchema,
  expandSchema,
  fieldsSchema,
  filterSchema,
  paginationSchema,
  sortSchema,
} from "../schema/common.js";

export function register(server: McpServer, client: PocketBaseClient): void {
  server.registerTool(
    "list_collections",
    {
      description:
        "List all collections. Superuser only. Supports pagination, filtering, and sorting.",
      inputSchema: z.object({
        ...paginationSchema.shape,
        filter: filterSchema,
        sort: sortSchema,
        fields: fieldsSchema,
      }),
    },
    async (params) => {
      const res = await client.request("GET", "/api/collections", {
        query: params,
      });
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "get_collection",
    {
      description: "Get a single collection by name or ID. Superuser only.",
      inputSchema: z.object({
        idOrName: collectionIdOrNameSchema,
        fields: fieldsSchema,
      }),
    },
    async ({ idOrName, fields }) => {
      const res = await client.request("GET", `/api/collections/${idOrName}`, {
        query: { fields },
      });
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "create_collection",
    {
      description:
        "Create a new collection (base, auth, or view). Superuser only. Provide the full collection config including name, type, fields, and rules.",
      inputSchema: z.object({
        name: z.string().describe("Unique collection name."),
        type: z
          .enum(["base", "auth", "view"])
          .default("base")
          .describe("Collection type."),
        fields: z
          .array(z.record(z.string(), z.unknown()))
          .describe("Array of field definitions."),
        listRule: z.string().nullable().optional(),
        viewRule: z.string().nullable().optional(),
        createRule: z.string().nullable().optional(),
        updateRule: z.string().nullable().optional(),
        deleteRule: z.string().nullable().optional(),
        indexes: z.array(z.string()).optional(),
        viewQuery: z.string().optional().describe("Required for view collections."),
        authRule: z.string().optional(),
        manageRule: z.string().nullable().optional(),
      }),
    },
    async (params) => {
      const res = await client.request("POST", "/api/collections", {
        body: params,
      });
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "update_collection",
    {
      description: "Update an existing collection. Superuser only.",
      inputSchema: z.object({
        idOrName: collectionIdOrNameSchema,
        name: z.string().optional(),
        fields: z.array(z.record(z.string(), z.unknown())).optional(),
        listRule: z.string().nullable().optional(),
        viewRule: z.string().nullable().optional(),
        createRule: z.string().nullable().optional(),
        updateRule: z.string().nullable().optional(),
        deleteRule: z.string().nullable().optional(),
        indexes: z.array(z.string()).optional(),
        viewQuery: z.string().optional(),
        authRule: z.string().optional(),
        manageRule: z.string().nullable().optional(),
      }),
    },
    async ({ idOrName, ...body }) => {
      const res = await client.request("PATCH", `/api/collections/${idOrName}`, {
        body,
      });
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "delete_collection",
    {
      description: "Delete a collection and all its records. Superuser only.",
      inputSchema: z.object({ idOrName: collectionIdOrNameSchema }),
    },
    async ({ idOrName }) => {
      await client.request("DELETE", `/api/collections/${idOrName}`);
      return { content: [{ type: "text", text: `Deleted collection ${idOrName}` }] };
    },
  );

  server.registerTool(
    "truncate_collection",
    {
      description:
        "Delete all records in a collection (keeps the schema). Superuser only.",
      inputSchema: z.object({ idOrName: collectionIdOrNameSchema }),
    },
    async ({ idOrName }) => {
      await client.request("DELETE", `/api/collections/${idOrName}/truncate`);
      return {
        content: [{ type: "text", text: `Truncated collection ${idOrName}` }],
      };
    },
  );

  server.registerTool(
    "import_collections",
    {
      description:
        "Bulk import collections (replace or create). Optionally delete missing. Superuser only.",
      inputSchema: z.object({
        collections: z.array(z.record(z.string(), z.unknown())),
        deleteMissing: z.boolean().default(false),
      }),
    },
    async ({ collections, deleteMissing }) => {
      await client.request("PUT", "/api/collections/import", {
        body: { collections, deleteMissing },
      });
      return { content: [{ type: "text", text: "Collections imported." }] };
    },
  );

  server.registerTool(
    "list_collection_scaffolds",
    {
      description:
        "Get default collection templates for each type (base, auth, view). Superuser only.",
      inputSchema: z.object({}),
    },
    async () => {
      const res = await client.request("GET", "/api/collections/meta/scaffolds");
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );
}

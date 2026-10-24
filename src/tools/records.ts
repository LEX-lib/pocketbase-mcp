import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { PocketBaseClient } from "../client.js";
import {
  collectionIdOrNameSchema,
  expandSchema,
  fieldsSchema,
  filterSchema,
  paginationSchema,
  recordIdSchema,
  sortSchema,
} from "../schema/common.js";

export function register(server: McpServer, client: PocketBaseClient): void {
  server.registerTool(
    "list_records",
    {
      description:
        "List records in a collection. Supports pagination, filtering, sorting, and relation expansion.",
      inputSchema: z.object({
        collection: collectionIdOrNameSchema,
        ...paginationSchema.shape,
        filter: filterSchema,
        sort: sortSchema,
        expand: expandSchema,
        fields: fieldsSchema,
      }),
    },
    async ({ collection, ...params }) => {
      const res = await client.request(
        "GET",
        `/api/collections/${collection}/records`,
        { query: params },
      );
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "get_record",
    {
      description: "Get a single record by ID.",
      inputSchema: z.object({
        collection: collectionIdOrNameSchema,
        id: recordIdSchema,
        expand: expandSchema,
        fields: fieldsSchema,
      }),
    },
    async ({ collection, id, expand, fields }) => {
      const res = await client.request(
        "GET",
        `/api/collections/${collection}/records/${id}`,
        { query: { expand, fields } },
      );
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "create_record",
    {
      description:
        "Create a new record in a collection. Provide fields as a JSON object.",
      inputSchema: z.object({
        collection: collectionIdOrNameSchema,
        data: z.record(z.string(), z.unknown()).describe("Record fields."),
        expand: expandSchema,
      }),
    },
    async ({ collection, data, expand }) => {
      const res = await client.request(
        "POST",
        `/api/collections/${collection}/records`,
        { body: data, query: { expand } },
      );
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "update_record",
    {
      description: "Update an existing record by ID.",
      inputSchema: z.object({
        collection: collectionIdOrNameSchema,
        id: recordIdSchema,
        data: z.record(z.string(), z.unknown()).describe("Fields to update."),
        expand: expandSchema,
      }),
    },
    async ({ collection, id, data, expand }) => {
      const res = await client.request(
        "PATCH",
        `/api/collections/${collection}/records/${id}`,
        { body: data, query: { expand } },
      );
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );

  server.registerTool(
    "delete_record",
    {
      description: "Delete a record by ID.",
      inputSchema: z.object({
        collection: collectionIdOrNameSchema,
        id: recordIdSchema,
      }),
    },
    async ({ collection, id }) => {
      await client.request(
        "DELETE",
        `/api/collections/${collection}/records/${id}`,
      );
      return {
        content: [{ type: "text", text: `Deleted record ${id} from ${collection}` }],
      };
    },
  );

  server.registerTool(
    "batch_records",
    {
      description:
        "Batch create/update/upsert/delete multiple records in a single transaction. Requires batch API to be enabled in settings.",
      inputSchema: z.object({
        requests: z
          .array(
            z.object({
              method: z.enum(["POST", "PATCH", "PUT", "DELETE"]),
              url: z
                .string()
                .describe(
                  'Relative path, e.g. "/api/collections/posts/records" or "/api/collections/posts/records/RECORD_ID".',
                ),
              body: z.record(z.string(), z.unknown()).optional(),
            }),
          )
          .describe("Array of batch request actions."),
      }),
    },
    async ({ requests }) => {
      const res = await client.request("POST", "/api/batch", { body: { requests } });
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    },
  );
}

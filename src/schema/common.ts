import * as z from "zod/v4";

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1).describe("Page number (offset), default 1."),
  perPage: z
    .number()
    .int()
    .min(1)
    .max(500)
    .default(100)
    .describe("Items per page, default 100, max 500."),
});

export const filterSchema = z
  .string()
  .optional()
  .describe(
    'PocketBase filter expression, e.g. `created >= "2024-01-01" && status = "active"`.',
  );

export const sortSchema = z
  .string()
  .optional()
  .describe('Sort expression, e.g. `-created,id` (prefix with `-` for DESC).');

export const expandSchema = z
  .string()
  .optional()
  .describe('Relation expansion, e.g. `author,comments.author`.');

export const fieldsSchema = z
  .string()
  .optional()
  .describe('Comma-separated fields to return, e.g. `*,expand.author.name`.');

export const collectionIdOrNameSchema = z
  .string()
  .min(1)
  .describe("Collection name or ID (e.g. `posts` or `_pbc_2287844090`).");

export const recordIdSchema = z
  .string()
  .min(1)
  .describe("Record ID.");

export function encodeQuery(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

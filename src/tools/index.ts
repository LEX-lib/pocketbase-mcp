import type { McpServer } from "@modelcontextprotocol/server";
import type { PocketBaseClient } from "../client.js";
import * as collections from "./collections.js";
import * as records from "./records.js";
import * as auth from "./auth.js";
import * as files from "./files.js";
import * as logs from "./logs.js";
import * as settings from "./settings.js";
import * as backups from "./backups.js";
import * as crons from "./crons.js";
import * as system from "./system.js";
import * as raw from "./raw.js";

export function registerAll(server: McpServer, client: PocketBaseClient): void {
  collections.register(server, client);
  records.register(server, client);
  auth.register(server, client);
  files.register(server, client);
  logs.register(server, client);
  settings.register(server, client);
  backups.register(server, client);
  crons.register(server, client);
  system.register(server, client);
  raw.register(server, client);
}

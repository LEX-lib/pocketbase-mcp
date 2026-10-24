import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = resolve(__dirname, "../dist/index.js");

const PB_URL = process.env.PB_TEST_URL ?? "http://127.0.0.1:8090";
const PB_EMAIL = process.env.PB_TEST_EMAIL ?? "admin@test.local";
const PB_PASSWORD = process.env.PB_TEST_PASSWORD ?? "SuperSecret123!";

let child: ChildProcess | null = null;
let client: Client | null = null;

async function startServer(): Promise<void> {
  console.log("Starting MCP server...");
  child = spawn("node", [SERVER_PATH], {
    env: {
      ...process.env,
      POCKETBASE_URL: PB_URL,
      POCKETBASE_SUPERUSER_EMAIL: PB_EMAIL,
      POCKETBASE_SUPERUSER_PASSWORD: PB_PASSWORD,
    },
    stdio: ["pipe", "pipe", "inherit"],
  });

  child.on("error", (err) => {
    console.error("Server error:", err);
    process.exit(1);
  });

  // Wait a bit for server to start
  await new Promise((r) => setTimeout(r, 1000));
}

async function connectClient(): Promise<void> {
  console.log("Connecting MCP client...");
  const transport = new StdioClientTransport({
    command: "node",
    args: [SERVER_PATH],
    env: {
      POCKETBASE_URL: PB_URL,
      POCKETBASE_SUPERUSER_EMAIL: PB_EMAIL,
      POCKETBASE_SUPERUSER_PASSWORD: PB_PASSWORD,
    },
  });

  client = new Client({ name: "e2e-test-client", version: "0.1.0" });
  await client.connect(transport);
}

async function test(name: string, fn: () => Promise<void>): Promise<boolean> {
  try {
    await fn();
    console.log(`✓ ${name}`);
    return true;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function runTests(): Promise<void> {
  const results: boolean[] = [];

  // Test 1: List tools
  results.push(
    await test("list_tools", async () => {
      const tools = await client!.listTools();
      const names = tools.tools.map((t) => t.name);
      const expected = [
        "health_check",
        "list_collections",
        "create_collection",
        "list_records",
        "create_record",
        "raw_request",
      ];
      for (const name of expected) {
        if (!names.includes(name)) {
          throw new Error(`Missing tool: ${name}`);
        }
      }
    }),
  );

  // Test 2: Health check
  results.push(
    await test("health_check", async () => {
      const res = await client!.callTool({ name: "health_check", arguments: {} });
      const text = (res.content as any)[0].text;
      const data = JSON.parse(text);
      if (data.code !== 200) throw new Error(`Health check failed: ${data.code}`);
    }),
  );

  // Test 3: Create collection
  const testCollection = `e2e_test_${Date.now()}`;
  results.push(
    await test("create_collection", async () => {
      const res = await client!.callTool({
        name: "create_collection",
        arguments: {
          name: testCollection,
          type: "base",
          fields: [
            { name: "title", type: "text", required: true },
            { name: "status", type: "bool" },
          ],
        },
      });
      const text = (res.content as any)[0].text;
      const data = JSON.parse(text);
      if (data.name !== testCollection) {
        throw new Error(`Collection name mismatch: ${data.name}`);
      }
    }),
  );

  // Test 4: List collections
  results.push(
    await test("list_collections", async () => {
      const res = await client!.callTool({
        name: "list_collections",
        arguments: {},
      });
      const text = (res.content as any)[0].text;
      const data = JSON.parse(text);
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Invalid list_collections response");
      }
    }),
  );

  // Test 5: Create record
  let recordId: string | null = null;
  results.push(
    await test("create_record", async () => {
      const res = await client!.callTool({
        name: "create_record",
        arguments: {
          collection: testCollection,
          data: { title: "Test post", status: true },
        },
      });
      const text = (res.content as any)[0].text;
      const data = JSON.parse(text);
      recordId = data.id;
      if (!recordId) throw new Error("No record ID returned");
    }),
  );

  // Test 6: List records
  results.push(
    await test("list_records", async () => {
      const res = await client!.callTool({
        name: "list_records",
        arguments: { collection: testCollection },
      });
      const text = (res.content as any)[0].text;
      const data = JSON.parse(text);
      if (!data.items || data.items.length === 0) {
        throw new Error("No records returned");
      }
    }),
  );

  // Test 7: Get record
  results.push(
    await test("get_record", async () => {
      if (!recordId) throw new Error("No record ID");
      const res = await client!.callTool({
        name: "get_record",
        arguments: { collection: testCollection, id: recordId },
      });
      const text = (res.content as any)[0].text;
      const data = JSON.parse(text);
      if (data.id !== recordId) throw new Error("Record ID mismatch");
    }),
  );

  // Test 8: Update record
  results.push(
    await test("update_record", async () => {
      if (!recordId) throw new Error("No record ID");
      const res = await client!.callTool({
        name: "update_record",
        arguments: {
          collection: testCollection,
          id: recordId,
          data: { title: "Updated title" },
        },
      });
      const text = (res.content as any)[0].text;
      const data = JSON.parse(text);
      if (data.title !== "Updated title") {
        throw new Error("Update failed");
      }
    }),
  );

  // Test 9: Delete record
  results.push(
    await test("delete_record", async () => {
      if (!recordId) throw new Error("No record ID");
      await client!.callTool({
        name: "delete_record",
        arguments: { collection: testCollection, id: recordId },
      });
    }),
  );

  // Test 10: Raw request
  results.push(
    await test("raw_request", async () => {
      const res = await client!.callTool({
        name: "raw_request",
        arguments: { method: "GET", path: "/api/health" },
      });
      const text = (res.content as any)[0].text;
      const data = JSON.parse(text);
      if (data.code !== 200) throw new Error("Raw request failed");
    }),
  );

  // Test 11: Delete collection
  results.push(
    await test("delete_collection", async () => {
      await client!.callTool({
        name: "delete_collection",
        arguments: { idOrName: testCollection },
      });
    }),
  );

  // Summary
  const passed = results.filter(Boolean).length;
  const total = results.length;
  console.log("");
  console.log(`Tests: ${passed}/${total} passed`);
  if (passed !== total) {
    process.exit(1);
  }
}

async function cleanup(): Promise<void> {
  if (client) {
    await client.close();
  }
  if (child) {
    child.kill();
  }
}

async function main(): Promise<void> {
  console.log("PocketBase MCP E2E Test");
  console.log(`PocketBase: ${PB_URL}`);
  console.log(`Server: ${SERVER_PATH}`);
  console.log("");

  try {
    await startServer();
    await connectClient();
    await runTests();
  } catch (err) {
    console.error("");
    console.error("Test suite failed:", err);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

main();

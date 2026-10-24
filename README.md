# PocketBase MCP Server

A Model Context Protocol (MCP) server for managing a PocketBase instance from chat. Works with Claude Desktop, Cursor, OpenCode, and any MCP-compatible client.

## Features

- **Auto-login**: Authenticates as superuser on startup and refreshes tokens automatically
- **30+ tools** covering the full PocketBase admin API:
  - Collections: list, get, create, update, delete, truncate, import, scaffolds
  - Records: list, get, create, update, delete, batch operations
  - Auth: password auth, impersonation, verification, password reset, email change
  - Files: file token generation, URL building
  - Logs: list, get, stats, truncate
  - Settings: get/update settings, test email, test S3
  - Backups: list, create, delete, restore, download, upload
  - Crons: list, run
  - System: health check
  - **Raw request**: escape hatch for any PocketBase API endpoint
- **Token refresh**: Automatically re-authenticates on 401/403 errors
- **Local test setup**: Docker-based PocketBase instance with e2e tests

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Build the server

```bash
npm run build
```

### 3. Configure your MCP client

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pocketbase": {
      "command": "node",
      "args": ["/absolute/path/to/pocketbase-mcp/dist/index.js"],
      "env": {
        "POCKETBASE_URL": "http://127.0.0.1:8090",
        "POCKETBASE_SUPERUSER_EMAIL": "admin@example.com",
        "POCKETBASE_SUPERUSER_PASSWORD": "your-password"
      }
    }
  }
}
```

#### Cursor

Create `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "pocketbase": {
      "command": "node",
      "args": ["/absolute/path/to/pocketbase-mcp/dist/index.js"],
      "env": {
        "POCKETBASE_URL": "http://127.0.0.1:8090",
        "POCKETBASE_SUPERUSER_EMAIL": "admin@example.com",
        "POCKETBASE_SUPERUSER_PASSWORD": "your-password"
      }
    }
  }
}
```

#### OpenCode

Add to `opencode.json` in your project or `~/.config/opencode/config.json` globally:

```json
{
  "mcp": {
    "pocketbase": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/pocketbase-mcp/dist/index.js"],
      "env": {
        "POCKETBASE_URL": "http://127.0.0.1:8090",
        "POCKETBASE_SUPERUSER_EMAIL": "admin@example.com",
        "POCKETBASE_SUPERUSER_PASSWORD": "your-password"
      }
    }
  }
}
```

#### VS Code

Create `.vscode/mcp.json`:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "pocketbase-email",
      "description": "PocketBase superuser email",
      "password": false
    },
    {
      "type": "promptString",
      "id": "pocketbase-password",
      "description": "PocketBase superuser password",
      "password": true
    }
  ],
  "servers": {
    "pocketbase": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/pocketbase-mcp/dist/index.js"],
      "env": {
        "POCKETBASE_URL": "http://127.0.0.1:8090",
        "POCKETBASE_SUPERUSER_EMAIL": "${input:pocketbase-email}",
        "POCKETBASE_SUPERUSER_PASSWORD": "${input:pocketbase-password}"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `POCKETBASE_URL` | Yes | PocketBase instance URL (e.g. `http://127.0.0.1:8090`) |
| `POCKETBASE_SUPERUSER_EMAIL` | Yes | Superuser email for auto-login |
| `POCKETBASE_SUPERUSER_PASSWORD` | Yes | Superuser password |
| `POCKETBASE_API_TIMEOUT_MS` | No | Request timeout in milliseconds (default: `15000`) |

## Available Tools

### Collections
- `list_collections` — List all collections (paginated)
- `get_collection` — Get a single collection by name or ID
- `create_collection` — Create a new collection (base, auth, or view)
- `update_collection` — Update an existing collection
- `delete_collection` — Delete a collection and all its records
- `truncate_collection` — Delete all records (keeps schema)
- `import_collections` — Bulk import collections
- `list_collection_scaffolds` — Get default collection templates

### Records
- `list_records` — List records with filtering, sorting, pagination
- `get_record` — Get a single record by ID
- `create_record` — Create a new record
- `update_record` — Update an existing record
- `delete_record` — Delete a record
- `batch_records` — Batch create/update/upsert/delete in one transaction

### Authentication
- `list_auth_methods` — List allowed auth methods for a collection
- `auth_with_password` — Authenticate a user with email/username + password
- `impersonate_user` — Impersonate an auth record (superuser only)
- `request_verification` — Send email verification request
- `confirm_verification` — Confirm email verification
- `request_password_reset` — Send password reset email
- `confirm_password_reset` — Confirm password reset
- `request_email_change` — Request email change
- `confirm_email_change` — Confirm email change

### Files
- `get_file_token` — Generate a short-lived file access token
- `build_file_url` — Build a public file URL for a record's file field

### Logs
- `list_logs` — List request logs (paginated)
- `get_log` — Get a single log entry
- `log_stats` — Get hourly aggregated log statistics
- `truncate_logs` — Delete all logs

### Settings
- `get_settings` — Get all application settings (secrets redacted)
- `update_settings` — Update application settings
- `test_email` — Send a test email
- `test_s3` — Test S3 storage connection

### Backups
- `list_backups` — List all backup files
- `create_backup` — Create a new backup
- `delete_backup` — Delete a backup
- `restore_backup` — Restore a backup (restarts PocketBase)
- `get_backup_download_url` — Generate a download URL
- `upload_backup` — Upload a backup file

### Crons
- `list_crons` — List all registered cron jobs
- `run_cron` — Manually trigger a cron job

### System
- `health_check` — Check PocketBase API health

### Raw
- `raw_request` — Send a raw HTTP request to any PocketBase API endpoint

## Local Development

### Run with MCP Inspector

```bash
npm run inspect
```

Then open http://localhost:5173 in your browser to interactively test tools.

### Run the server directly

```bash
POCKETBASE_URL=http://127.0.0.1:8090 \
POCKETBASE_SUPERUSER_EMAIL=admin@test.local \
POCKETBASE_SUPERUSER_PASSWORD=password123 \
npm run dev
```

## Local Test Setup

The `test/local/` directory contains a Docker-based PocketBase instance for testing:

```bash
cd test/local
docker compose up -d
./setup.sh
```

This starts PocketBase on http://127.0.0.1:8090 with:
- **Email:** admin@test.local
- **Password:** SuperSecret123!

Run the e2e test suite:

```bash
cd ../..
npm run test:e2e
```

See `test/local/README.md` for details.

## Docker

Build and run with Docker:

```bash
docker build -t pocketbase-mcp .

docker run -i --rm \
  -e POCKETBASE_URL=http://host.docker.internal:8090 \
  -e POCKETBASE_SUPERUSER_EMAIL=admin@example.com \
  -e POCKETBASE_SUPERUSER_PASSWORD=your-password \
  pocketbase-mcp
```

Use `host.docker.internal` to access PocketBase running on your host machine.

## Architecture

- **TypeScript + Node 22** — modern, type-safe
- **@modelcontextprotocol/server v2** — latest MCP SDK with `registerTool()` API
- **Native fetch** — no PocketBase SDK dependency, explicit token management
- **Auto-login + refresh** — authenticates on startup, re-auths on 401/403
- **stdio transport** — works with all MCP clients (Claude Desktop, Cursor, OpenCode, etc.)

## License

MIT

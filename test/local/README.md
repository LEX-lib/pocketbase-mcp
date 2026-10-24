# Local Test Setup

This directory contains a Docker-based PocketBase instance for testing the MCP server.

## Quick Start

1. **Start PocketBase:**
   ```bash
   docker compose up -d
   ./setup.sh
   ```

2. **Run the MCP server:**
   ```bash
   cd ../..
   npm install
   npm run build
   POCKETBASE_URL=http://127.0.0.1:8090 \
   POCKETBASE_SUPERUSER_EMAIL=admin@test.local \
   POCKETBASE_SUPERUSER_PASSWORD=SuperSecret123! \
   npm run dev
   ```

3. **Test with MCP Inspector:**
   ```bash
   ./inspect.sh
   ```
   Then open http://localhost:5173 in your browser.

4. **Run e2e test:**
   ```bash
   cd ../..
   npm run test:e2e
   ```

## Credentials

- **URL:** http://127.0.0.1:8090
- **Email:** admin@test.local
- **Password:** SuperSecret123!

## Teardown

```bash
./teardown.sh
```

To completely remove all data:
```bash
docker volume rm pocketbase-mcp-test_pb_data
```

## PocketBase Dashboard

Open http://127.0.0.1:8090/_/ in your browser and log in with the credentials above.

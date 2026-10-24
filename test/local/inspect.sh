#!/bin/bash
set -e

echo "Starting MCP inspector..."
echo "Open http://localhost:5173 in your browser"
echo ""
echo "Environment:"
echo "  POCKETBASE_URL=http://127.0.0.1:8090"
echo "  POCKETBASE_SUPERUSER_EMAIL=admin@test.local"
echo "  POCKETBASE_SUPERUSER_PASSWORD=SuperSecret123!"
echo ""

export POCKETBASE_URL=http://127.0.0.1:8090
export POCKETBASE_SUPERUSER_EMAIL=admin@test.local
export POCKETBASE_SUPERUSER_PASSWORD=SuperSecret123!

cd ../..
npm run inspect

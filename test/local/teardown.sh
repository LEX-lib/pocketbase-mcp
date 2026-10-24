#!/bin/bash
set -e

echo "Stopping PocketBase..."
docker compose down

echo ""
echo "To remove all data (fresh start):"
echo "  docker volume rm pocketbase-mcp_pb_data"

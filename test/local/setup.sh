#!/bin/bash
set -e

# Wait for PocketBase to be ready
echo "Waiting for PocketBase..."
for i in {1..30}; do
  if curl -s http://127.0.0.1:8090/api/health > /dev/null 2>&1; then
    echo "PocketBase is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "Error: PocketBase did not start in time"
    exit 1
  fi
  sleep 1
done

# Create initial superuser
echo "Creating superuser..."
docker exec pocketbase-mcp-test /usr/local/bin/pocketbase superuser create admin@test.local SuperSecret123! || {
  echo "Superuser may already exist, continuing..."
}

echo ""
echo "PocketBase is running at http://127.0.0.1:8090"
echo "Superuser: admin@test.local / SuperSecret123!"
echo ""
echo "To start the MCP server:"
echo "  cd .. && npm run dev"
echo ""
echo "To run the e2e test:"
echo "  cd .. && npm run test:e2e"

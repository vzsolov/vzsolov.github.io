#!/usr/bin/env bash
# Spin up a local HTTP server to test the site.
# Usage: ./test.sh [port]

set -euo pipefail

PORT="${1:-8791}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

# Pick a server: prefer Python 3, fall back to Ruby, then Node.
if command -v python3 &>/dev/null; then
  SERVER_CMD="python3 -m http.server $PORT"
elif command -v ruby &>/dev/null; then
  SERVER_CMD="ruby -run -e httpd . -p $PORT"
elif command -v npx &>/dev/null; then
  SERVER_CMD="npx --yes serve -l $PORT ."
else
  echo "Error: need python3, ruby, or node/npx to run a local server." >&2
  exit 1
fi

# Kill any existing process on the port.
if lsof -ti tcp:"$PORT" &>/dev/null; then
  echo "Killing existing process on port $PORT..."
  lsof -ti tcp:"$PORT" | xargs kill -9
fi

echo ""
echo "  VZsolov Trip Repo — local server"
echo "  ─────────────────────────────────────────"
echo "  http://localhost:$PORT/"
echo "  http://localhost:$PORT/greece24.html"
echo "  http://localhost:$PORT/cyprus24.html"
echo ""
echo "  Press Ctrl+C to stop."
echo ""

cd "$ROOT"
exec $SERVER_CMD

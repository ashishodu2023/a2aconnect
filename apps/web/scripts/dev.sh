#!/usr/bin/env sh
set -e
PORT="${PORT:-4783}"
HOST="${HOST:-127.0.0.1}"
exec npx next dev -p "$PORT" -H "$HOST"

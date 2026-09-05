#!/usr/bin/env bash
# Desk pre-flight: build, serve, sweep, stop.
#
# The runtime checks have to run against a production build — dev serves
# unminified bundles, re-renders on every request, and reports layout shift
# that will never happen to anyone. Keeping the server's whole life inside one
# script also means it cannot be left running, or killed halfway through.
#
#   scripts/preflight-admin.sh [--quick] [--skip-build]
#
# Dev-only tooling. Not part of the shipped site.
set -euo pipefail

cd "$(dirname "$0")/.."
PORT="${PORT:-4310}"
ARGS=()
SKIP_BUILD=0
for a in "$@"; do
  case "$a" in
    --skip-build) SKIP_BUILD=1 ;;
    *) ARGS+=("$a") ;;
  esac
done

if [ "$SKIP_BUILD" -eq 0 ]; then
  echo "── build ─────────────────────────────────────────────"
  npm run build 2>&1 | tail -30
fi

echo "── serve on :$PORT ───────────────────────────────────"
PORT="$PORT" npm run start >/tmp/preflight-admin-server.log 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null || true' EXIT

for _ in $(seq 1 90); do
  if curl -sf -o /dev/null "http://localhost:$PORT/"; then break; fi
  sleep 1
done
if ! curl -sf -o /dev/null "http://localhost:$PORT/"; then
  echo "server never came up:"
  tail -20 /tmp/preflight-admin-server.log
  exit 1
fi

echo "── sweep ─────────────────────────────────────────────"
HOST=localhost node --env-file=.env.local scripts/sweep-admin.mjs "${ARGS[@]+"${ARGS[@]}"}"

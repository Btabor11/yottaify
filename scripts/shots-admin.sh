#!/usr/bin/env bash
# A design-review set of the desk, taken against a production build.
#
#   scripts/shots-admin.sh [--skip-build]
#
# One server for the whole set, so a review is one command and every frame is
# of the same build. Writes to shots/. Dev-only tooling.
set -euo pipefail

cd "$(dirname "$0")/.."
PORT="${PORT:-4310}"

if [ "${1:-}" != "--skip-build" ]; then
  echo "── build ─────────────────────────────────────────────"
  npm run build 2>&1 | tail -4
fi

PORT="$PORT" npm run start >/tmp/shots-admin-server.log 2>&1 &
SERVER=$!
trap 'kill "$SERVER" 2>/dev/null || true' EXIT
for _ in $(seq 1 90); do curl -sf -o /dev/null "http://localhost:$PORT/" && break; sleep 1; done

# Second argument to the reporter is the status the route is supposed to
# answer with, so the deliberate 404 frame is checked rather than excused.
shot() { HOST=localhost node --env-file=.env.local scripts/shot.mjs "$@" | node -e '
  let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);
  const want=Number(process.argv[2]||200);
  const bad=[j.landed!==process.argv[1]?`landed ${j.landed}`:null,j.status!==want?`status ${j.status}`:null,
  j.errors.length?`${j.errors.length} console error(s)`:null,
  j.metrics?.hasHorizontalOverflow?"OVERFLOW":null].filter(Boolean);
  console.log(`  ${j.path.padEnd(34)} ${bad.length?"⚠ "+bad.join(" · "):"ok"}`)});' "$1" "${EXPECT:-200}"; }

# A reference that is actually on the board, so the dossier frame is real.
REF=$(HOST=localhost node --env-file=.env.local -e '
const {chromium}=require("playwright");const {adminContext}=require("./scripts/admin-auth.mjs");
(async()=>{const b=await chromium.launch();const c=await b.newContext(adminContext());const p=await c.newPage();
await p.goto("http://localhost:'"$PORT"'/admin",{waitUntil:"load"});
process.stdout.write(await p.evaluate(()=>document.querySelector("td .adm-ref")?.textContent?.trim()??""));
await b.close()})()')

echo "── frames ────────────────────────────────────────────"
shot /admin board-1440 1440 900
shot /admin board-pick 1440 900 --pick
shot /admin board-hold 1440 900 --holdcard
shot /admin board-full 1440 1200 --full
shot /admin board-768 768 1100
shot /admin board-390 390 1400
shot /admin board-2560 2560 1100
shot /admin board-reduce 1440 900 --reduce
shot /admin board-nojs 1440 1200 --nojs
shot "/admin?q=zzzz-no-such-company" board-empty 1440 900
shot "/admin?status=spam" board-spam 1440 900
shot "/admin?status=all&sort=-capacity" board-sorted 1440 1400 --full
shot "/admin/r/$REF" dossier-1440 1440 1500 --full
shot "/admin/r/$REF" dossier-390 390 1500 --full
shot "/admin/r/$REF" dossier-pending 1440 900 --pending
shot /admin/login login-1440 1440 900
shot /admin/login login-390 390 844
EXPECT=404 shot /admin/r/R-ZZZZZZ notfound 1440 700

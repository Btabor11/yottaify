# Market legibility tracker

`/market` — a daily-updated page that shows what every B300 seller publishes,
what public trackers report about them, how far apart those figures are, and
how much listed capacity is actually bookable. It is not a price comparison;
it is a measurement of how *legible* the market is. Our rate is the fixed
reference line.

## Why this shape

A 29th price aggregator loses to the existing 28 on freshness by design, and
proves to a visitor that someone charges $4.99. What no aggregator publishes
is the disagreement between them — RunPod at $6.94 / $7.39 / $7.89 across
three trackers on the same day — or the share of listed configs that can be
ordered (11 of 89 today). Those are the numbers only a first-hand, dated,
evidence-keeping tracker can produce, and they are the argument the whole site
already makes.

## Architecture

```
lib/market/
  types.ts        Observation · Evidence · ProviderDigest · Snapshot · Legibility
  catalog.ts      pure data: every source's identity, method, terms; provider labels
                  (browser-safe — the UI imports only this, never the fetchers)
  http.ts         fetch with tracker UA, timeout, one retry, body hash, excerpt()
  sources/
    base.ts       Source interface, obs() builder, evidence()
    providers.ts  RunPod · Vast.ai · Nebius · Hyperstack · Modal · AWS · Oracle
                  CoreWeave (gated) · Together (gated) · Lambda (not offered)
    trackers.ts   GetDeploying · ComputeUnion · GPU Finder
                  gpus.io (declined: bot wall) · gpucost.org (declined: ToS)
  digest.ts       observations → daily Snapshot; the legibility index
  refresh.ts      one run: all sources in parallel, each isolated, timed out
  schema.ts       drizzle tables + CREATE TABLE IF NOT EXISTS (no migration step)
  store.ts        Postgres when DATABASE_URL, else .data/market/*.json

app/api/market/refresh   GET, Bearer CRON_SECRET — runs and stores. Vercel Cron 06:17 UTC.
app/api/market/latest    GET — latest snapshot + history (edge-cached 1h).
app/(site)/market        the page. ISR, revalidate hourly.

components/market/
  MarketDashboard   state: selected day, hovered/pinned seller
  Hero              legibility index (hero figure) + its four components
  DayScrubber       timeline; native <input type=range> under a drawn track; replay
  floor/            FloorMount (gate) · FloorScene (r3f) · FloorStill (SVG) · blade.ts · palette.ts
  SpreadChart       dumbbell per seller: published (filled) vs reported (hollow), our rail
  BookableMeter     "N of M configs in stock" as a meter
  HistoryLines      two single-series lines (index, median) — not a dual axis
  ProviderDetail    one seller, every figure, with evidence
  SourcesLedger     every source incl. refusals and today's failures
  EvidenceLink      URL + timestamp + hash + excerpt + derivation, on demand

scripts/market/
  probe.mjs               run every source, print, store nothing
  refresh.mjs             run and store (same path as the cron)
  synthetic-history.mjs   DEV ONLY: fake labelled history so the scrubber can be tested
```

## The legibility index

0–100, composed — never asserted. Weights are opinions written down:

| Component | Weight | Meaning |
|---|---|---|
| agreement | 40% | 1 − mean spread across sellers with ≥ 2 figures; a 20% mean spread = 0 |
| coverage | 25% | share of sellers attempted first-hand whose rate we could read (gated = miss) |
| visibility | 15% | share of sellers for whom anyone publishes a stock signal |
| bookable | 20% | GetDeploying's in-stock ÷ listed configs (falls back to visibility when unread) |

Every component is shown next to the number with its own explanation.

## Stock has a basis

`Observation.stockBasis` is `provider` (the seller's own field), `tracker-checked`
(GetDeploying polls seller APIs hourly), or `tracker-heuristic` (ComputeUnion's
estimate). The digest prefers them in that order, and **"lowest bookable" never
rests on a heuristic** — this is what stops Prime Intellect at $4.99 with an
80% "availability" guess from being called bookable.

## Source policy

Read: anything whose robots.txt allows the page and whose terms do not forbid
automated reading. Attribute every figure. Identify as
`CluerMarketTracker/1.0 (+/market)`. One request per source per day.

Not read, and listed as such on the page:
- **gpus.io** — Cloudflare JS challenge. Their data is reachable via a WAF gap on a 404 route. We do not use it.
- **gpucost.org** — terms forbid automated collection.
- **Vast.ai's published pricing JSON** — carries a data licence restricting use in an index. We use their marketplace API, which does not.
- **GPU Finder's /api/v1** — robots reserves it for one named crawler. We read their public page's structured data instead.

## Assets (public/market/, 840 KB, lazy-loaded only when the canvas mounts)

All CC0 from Poly Haven — see `public/market/LICENSES.md`. `studio_512.hdr`
(environment reflections), `pcb_*.jpg` (PBR set for the procedural GPU
module's board), `rack.glb` (the fleet's frame). There is no CC0 GPU model
anywhere; the module is procedural (`blade.ts`, < 3k triangles).

## The 3D floor's contract

Follows `DESIGN.md` §5 and the shared `SceneMount` rules: the SVG still is the
default render and is complete on its own; the canvas mounts only in view,
once idle, never under reduced motion, without WebGL2, on < 4 cores or with
Data Saver; `frameloop` stops off-screen; the cross-fade waits for the first
real frame. `?scene=force` skips the device heuristics for review on weak
machines (never the motion or WebGL checks).

Colour does two jobs only: module LEDs carry stock (status palette); the rail
and hover carry emphasis. Identity is position + label. `floor/palette.ts`
mirrors CSS tokens with `/* --token */` comments for `audit.mjs`.

## Operate

```
npm run market:probe            # check every parser, store nothing
npm run market:refresh          # run + store (file store locally)
CRON_SECRET=… vercel env add    # production: the cron sends it as a Bearer token
```

Add to `.env`: `CRON_SECRET` (32+ random bytes). `vercel.json` schedules the
refresh daily at 06:17 UTC. A failed source shows as failed on the page for
that day rather than repeating yesterday's number.

## When a parser breaks

Each parser throws a specific message ("HGX B300 row not found in Apollo
state") rather than returning a zero. `npm run market:probe -- <sourceId>`
shows the failure; the recipe comments in `providers.ts` / `trackers.ts` say
what each anchor was on 2026-09-04.

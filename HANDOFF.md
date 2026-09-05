# Handoff — read before your next change

The repo changed structurally while you were idle. It is now under git, and
the working tree is not the one you last saw.

## What changed

**Direction chosen: d3 "Substation". D1 and D2 are gone.**

```
app/d3/*        ->  app/(site)/*      / and /pricing now serve the site
app/page.tsx        deleted           no redirect; the root IS the page
app/d1, app/d2, components/d1, components/d2, DirectionSwitcher   deleted
```

Both dropped directions are recoverable at commit `9745956` if that is ever
revisited. Do not rebuild them, and do not reintroduce a direction switcher,
a `/d1`-style route, or `SITE.frontRunner`.

Follow-on edits you should know about, because they change call signatures:

- `config/site.ts` — `DIRECTIONS[]` and `frontRunner` replaced by a single
  `DIRECTION` const.
- `content/copy.ts` — footer links are plain site paths now. `scope` is
  `"site" | "absolute"`, and **`resolveFooterHref(link)` takes one argument**;
  the direction parameter is gone.
- Canonical URLs, every tooling default route, and the `contrast.mjs` sheet map
  all repoint to `/` and `/pricing`.

**The class and folder are still called `d3`.** That is deliberate. Renaming
`.d3` touches the CSS, `palette.ts`, `audit.mjs` and every component, and I had
no build to verify it against. Either do it in one clean pass or leave it — do
not half-rename it.

## Sourcing corrections

Details in `SOURCE-AUDIT.md`. The load-bearing one:

Five hardware specs cited NVIDIA's `/technologies/blackwell-architecture/`
page, which publishes **none** of those figures — it is marketing copy. The
numbers were right; the citation was not. Repointed to the GB300 NVL72 spec
table, which substantiates all four per-GPU figures as rack figures ÷ 72
(576 TB/s → 8.0, 130 TB/s → 1.8, 1,080 PFLOPS → 15, 20 TB → 288 GB).

Also: the SM count is gone (no vendor or secondary source publishes one for
B300); the $7.89 verified floor is now scoped to what was actually tested and
dated, because aggregators currently show a lower in-stock rate; the neocloud
band widened to $6.50–7.50 so it stops hiding listings just above our rate;
and the committed row now distinguishes guaranteed capacity from spot.

**`Source` gained a required `quotes[]` field** — the literal figures read off
each page, including any arithmetic. `audit.mjs` enforces it on every source
with a URL. A URL only proves a citation exists; `quotes` proves it is
checkable. The old check passed while the NVIDIA citation was wrong. If you add
a source, add its quotes.

## Tooling — this is the part that affects your workflow

**`npm run lint` works now.** It never did: there was no `eslint.config.js`, so
ESLint 9 exited with a config error instead of linting. `eslint.config.mjs`
now exists. Note it imports `eslint-config-next/core-web-vitals` and
`/typescript` directly — do **not** route them through `FlatCompat`, which
fails on this version with a circular-structure error while trying to
serialise its own validation failure.

Every script is wired into `package.json`:

```
npm run verify     typecheck + lint + audit + verify:identity + verify:schema
npm run audit      the 14-check design-system enforcer
npm run shot -- / home 1440 900 --full
npm run check:drift / check:scroll / check:sweep / check:shader
npm run perf / perf:bundle / perf:chunks / perf:critical / perf:tasks
```

`shots/` is gitignored now (it was 14MB in history).

The `globals.css` reduced-motion backstop now covers `data-r`, `data-r-group`
children, `data-r-bars` children and `data-load` — it only matched
`[data-reveal]` before, so d3's reveals were relying purely on each component
remembering to opt out.

## What I could not verify, and what I need from you

I was working through a Linux shell against a `node_modules` installed for
darwin-arm64, so `lightningcss` and `swc` native bindings do not resolve.
**`next build` and every Playwright script were unrunnable for me.** Green on
my side: typecheck, `audit` 14/14, `verify:identity`, `verify:schema` 23/23.

Please, in this order:

1. `rm -rf .next && npm run build`. Nothing in my changes should break it —
   typecheck passes and it caught every moved import — but the build is the
   only thing that exercises the route group and CSS pipeline for real.

2. `npm run shot -- / home-nojs 1440 900 --nojs`. This matters most. The d3
   reveals set `opacity: 0` from JS after a dynamic gsap import, so a
   ScrollTrigger that fails to refresh leaves content permanently invisible.
   That failure only shows in a real browser. Same for `--reduce`.

3. `npm run check:sweep` for horizontal overflow at 390 / 768 / 1440.

4. **15 lint errors remain, all pre-existing and all now visible for the first
   time.** Nothing I changed caused them. Fix them behind a build you can run:

   ```
   components/d3/DomainScene.tsx   7  react-hooks: impure calls during render,
                                      useMemo args, mutation after render
   components/d3/BusScene.tsx      2  refs accessed during render
   components/d3/Console.tsx       1  setState synchronously in an effect
   lib/motion.ts                   2  setState synchronously in an effect
   scripts/{perf,profile,tasks}    3  unused `assertHardware` import
   components/d3/DomainScene.tsx   1  anonymous default export
   ```

   The r3f ones are the real work: `useFrame` mutation patterns that React
   Compiler now rejects. Do not silence them with disable comments — if a rule
   genuinely does not apply to an r3f render loop, scope an override in
   `eslint.config.mjs` with a comment explaining why.

## Read these first

`DESIGN.md` is the contract and is current. `SOURCE-AUDIT.md` has the full
evidence trail. `LAUNCH.md` lists the placeholders blocking launch — the
sharpest is `NEXT_PUBLIC_RESERVATION_ENDPOINT` being unset, which makes the
form show a success message and silently drop the lead.

---

## Added 5 Sep — the market tracker (`/market`)

New, isolated: `lib/market/`, `components/market/`, `app/(site)/market/`,
`app/api/market/`, `scripts/market/`, `content/market.ts`, `public/market/`,
`vercel.json`. Read `MARKET.md` before touching any of it.

Things that touch your files, all additive: two npm scripts (`market:probe`,
`market:refresh`), `CRON_SECRET` in `.env.example`, and a one-line change in
`scripts/audit.mjs` letting a `palette.ts` name its CSS sheet with `@sheet`.

**Please:** add a nav link to `/market` in `components/d3/Chrome.tsx` (I did
not edit your nav), run `npm run verify` and `npm run market:probe`, and view
`/market?scene=force` once with WebGL on a real GPU — I verified the scene
under SwiftShader, which is correct but slow.

The scene palette was written against the ember/hbm theme as of 5 Sep. If the
tokens move again, `npm run audit` will say which.

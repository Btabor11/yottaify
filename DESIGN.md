# DESIGN.md — design system contract

Read this before writing or changing any component, stylesheet, or token.
It describes a system that already exists. It is not aspirational.

Stack: Next.js 16 (App Router) · React 19 · Tailwind v4 (CSS-first `@theme`) ·
TypeScript · react-three-fiber for the one WebGL scene. No `tailwind.config.js`.
Tokens live in CSS.

---

## 0. What the site is

One page that tells one story and then proves it.

- **The story** (`components/d3/story/`) is a dark, scroll-driven sequence of
  seven chapters. A single particle field morphs through the path of the
  current — horizon → terrain → meter → bus → node → die → the word "DAYS" —
  while the chapter copy scrolls past it. The hero is chapter 00.
- **The paperwork** (`.d3-paper`) is the light, paper-toned evidence that
  follows: pricing, hardware, operator, process, questions, reservation. Every
  section opens with an engineering title block (`components/d3/Bay.tsx`) that
  numbers the sheet.
- **The footer** returns to the dark ground.

The idea the whole thing is built on: *a specification, then its sources*.
Anything that does not serve that is decoration and should be argued for.

---

## 1. The token bridge — never hardcode a colour

`app/globals.css` maps Tailwind colour utilities onto semantic CSS variables:

```
--color-bg  → var(--bg)      --color-ink   → var(--ink)
--color-ink-2/-3             --color-rule  → var(--rule)
--color-surface / -2         --color-accent, --accent-2, --caution, --focus
```

So `bg-bg text-ink border-rule` resolve to a **different palette per ground**,
because `.d3` (dark) and `.d3-paper` (paper) each bind `--bg`, `--ink`, etc.
A component styled in semantic tokens is correct on both grounds without
knowing which one it is on.

**Rules:**

- Never write a hex value in a component. Never write `bg-zinc-900`, `text-white`,
  `border-neutral-800`, or any Tailwind palette colour. The one exception is
  `components/d3/palette.ts` — see section 2.
- Use the semantic utility (`bg-surface`) or `text-[var(--ink-2)]` when you need a
  token Tailwind has no utility for.
- Adding a colour means adding a token to `@theme` **and** binding it in both
  `.d3` and `.d3-paper`. If you can't name it semantically, you don't need it.

### Tokens, by role

| Token | Dark ground | Paper ground | Role |
|---|---|---|---|
| `--bg` `--surface` `--surface-2` | warm near-black | warm off-white | grounds |
| `--ink` `--ink-2` `--ink-3` | paper-white → grey | near-black → grey | text, in order of emphasis |
| `--accent` | ember | copper | the one colour a control may be |
| `--accent-2` | ember, darker | copper, darker | hover / pressed |
| `--ember` `--hbm` | poles of `--live` | (same, darkened) | scene + live colour |
| `--live` | `color-mix(in oklch longer hue, ember, hbm)` by `--phase` | | voice clauses, lead figures, particle field |
| `--caution` `--hot` `--alarm` | sodium, red, red | | status only, never decoration |
| `--rule` `--rule-strong` | | | **decorative** separators only |
| `--edge` | | | the **only** border on an interactive control |
| `--focus` | | | focus ring |

`--live` travels the long way round the hue wheel — ember → red → magenta →
violet → blue → teal — so it never passes through mud. `scripts/audit.mjs`
samples the whole curve against every ground and fails if any stop falls under
4.5:1. `lib/oklch.ts` is the same maths in TypeScript, used to bake the ramp
texture the shader reads.

---

## 2. The direction — `.d3` "Substation"

One direction ships. D1 and D2 were built, reviewed and dropped; they are
recoverable from git history at commit `9745956` and nothing about them remains
in the working tree. Do not reintroduce a direction switcher.

- Root class `.d3` on the route-group layout; tokens in `app/(site)/d3.css`.
- `.d3-paper` on any subtree rebinds the tokens to the paper ground.
- `--phase` (0–1) is written on `.d3` by `components/d3/Field.tsx` from the
  story's scroll progress. Everything that "travels" reads it.

### Type roles

| Class | Face | Use |
|---|---|---|
| `.d3-display` | Big Shoulders, variable weight | headlines, uppercase, tight |
| `.d3-voice` | Instrument Serif italic | one clause per headline, set in `--live` |
| `.d3-body` | Instrument Sans | running copy |
| `.d3-tag` | Martian Mono, uppercase, tracked | labels, eyebrows |
| `.d3-figure` | Martian Mono, tabular | numbers that will be compared |

Display type is *under load*: `[data-load]` headlines animate
`font-variation-settings: "wght"` from 300 to their resting weight as they
enter the viewport. The resting weight is the base state. `Field.tsx` locks
each line's break at the resting weight before the weight moves (`.d3-line`),
so a charging headline can never re-wrap.

**Never size a `.d3-display` element in `ch`.** `1ch` is the advance of the
"0" glyph, which changes with weight; a `max-w-[14ch]` heading grows 30% as it
charges and shifts everything below it. Use `em`.

### Structure

- Story: `.d3-story` (pin host) › `.d3-stage` (sticky canvas + `.d3-stage-scrim`)
  › `.d3-chapter[data-chapter]` in normal flow.
- Paper: `.d3-titleblock`, `.d3-panel`, `.d3-ledger`, `.d3-table`, `.d3-grid`,
  `.d3-contours`, `.d3-actor`, `.d3-faq`.
- Controls: `.d3-btn` (primary / ghost), `.d3-input` (underline), `.d3-ticket`
  (radio), `.d3-chip` (preset), `.d3-cell` (allocation board), `.d3-link`.

### The scene

`components/d3/story/StoryScene.tsx` is the only WebGL. It mounts through
`components/shared/SceneMount.tsx` in `progressMode="pin"`, which gates on
reduced motion, WebGL support and device budget, and renders
`StoryStill.tsx` (an SVG of the same drawing) otherwise. Shapes come from
`shapes.ts`, one `Float32Array` per chapter; the shader morphs between
neighbours by `--phase` and colours by the baked OKLCH ramp.

`components/d3/palette.ts` holds hex values because WebGL cannot read CSS
variables. Every entry carries a `/* --token */` comment and the audit fails
if the two drift. This is the only sanctioned exception to section 1.

---

## 3. Content and identity — zero hardcoded strings

- Components import copy **only** from `@/content` (barrel: `content/index.ts`).
  Story chapters live in `content/story.ts` and cite the source they rest on.
- All names/URLs/handles read from `config/site.ts`. Never type the name into
  a component. Rename = edit `SITE.name` only, then `npm run verify:identity`.
- A figure changes in `content/` once, and the story, the paper and the OG image
  (`app/opengraph-image.tsx`, generated) all pick it up.

---

## 4. Accessibility — non-negotiable

- Body text ≥ 4.5:1 on every ground it can sit on. The audit measures this for
  every ink token and for the whole `--live` curve.
- `--rule` / `--rule-strong` are **decorative separators only**.
  `--edge` is the ONLY border permitted on an interactive control (≥ 3:1).
- Focus rings are never removed, only styled. `:focus-visible` → 2px `var(--focus)`.
- Every page has a `.skip-link` and a `#main` target.
- Comparable figures carry `.d3-figure` or `.tnum` → tabular lining numerals.
- The story reads top-to-bottom as plain prose without the canvas. The canvas
  is `aria-hidden`; the SVG still carries a `<title>`.

---

## 5. Motion — the base state is the finished state

This is the rule most likely to be broken. Read it twice.

- Keyframes animate **from** an offset, with `backwards`, and **no fill-mode
  forwards**. The element's resting CSS is its final state.
- Consequence: a JS failure cannot hide the headline; the headline paints on the
  first frame and can be the LCP element.
- Never gate content visibility on JS. Never `opacity: 0` as a base state.
- `prefers-reduced-motion` is a hard global stop in `globals.css`. The scene does
  not mount; the still does. Scroll-linked `--phase` still updates, because
  colour change is not motion.
- Load choreography: `.d3-charge` (weight), `.d3-rise` (offset), `.d3-draw`
  (stroke). Total hero choreography stays under ~700ms.
- Lenis owns scrolling. Do not add `scroll-behavior: smooth` anywhere.

---

## 6. Verification

Static gate — no browser, no dev server, runs in seconds:

```
npm run verify        # typecheck + lint + audit + verify:identity + verify:schema
```

`npm run audit` is the design-system enforcer: 15 checks covering hardcoded
colour, palette/token drift, ink contrast on both grounds, the live ramp,
price and spec literals in components, forbidden price superlatives, the
company name appearing outside config, source completeness, motion resting
states, and the form working without JS.

Browser checks — need `npm run dev` in another terminal. Use `HOST=localhost`;
Turbopack refuses cross-origin dev chunks from `127.0.0.1`, and the page will
appear to never hydrate.

```
HOST=localhost PORT=3000 npm run shot -- / home 1440 900 --full
npm run shot -- / home-reduced 1440 900 --reduce
npm run shot -- / home-nojs 1440 900 --nojs
npm run shot -- / node 390 844 --at=#chapter-node
npm run check:drift                        # does --live still travel
npm run check:scroll                       # frame budget while scrolling
npm run check:sweep                        # every route x every viewport
npm run perf                               # FCP/LCP/CLS against a prod build
```

Output lands in `shots/`, which is gitignored. **Look at the screenshot before
claiming a change is done.**

Ship gate for any visual change: `--reduce` and `--nojs` both still legible,
`hasHorizontalOverflow: false` at 390 / 768 / 1440.

## 7. Before you finish

- [ ] `npm run verify` clean
- [ ] No hex values or Tailwind palette colours added to a component
- [ ] New strings live in `content/`, not in JSX
- [ ] New tokens bound in **both** `.d3` and `.d3-paper`
- [ ] Loading, empty, error and disabled states exist for every new control
- [ ] Screenshotted at 390 / 768 / 1440, plus `--reduce` and `--nojs`
- [ ] Focus ring visible on every new interactive element, keyboard-tested
- [ ] If the story changed: every chapter still cites a source in `content/story.ts`

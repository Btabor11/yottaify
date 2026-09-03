# DESIGN.md — design system contract

Read this before writing or changing any component, stylesheet, or token.
It describes a system that already exists. It is not aspirational.

Stack: Next.js 16 (App Router) · React 19 · Tailwind v4 (CSS-first `@theme`) · TypeScript.
No `tailwind.config.js`. Tokens live in CSS.

---

## 1. The token bridge — never hardcode a colour

`app/globals.css` maps Tailwind colour utilities onto semantic CSS variables:

```
--color-bg  → var(--bg)      --color-ink   → var(--ink)
--color-ink-2/-3             --color-rule  → var(--rule)
--color-surface / -2         --color-accent, --accent-2, --caution, --focus
```

So `bg-bg text-ink border-rule` resolve to a **different palette per direction**,
because each direction root (`.d1`, `.d2`) rebinds `--bg`, `--ink`, etc.

**Rules:**

- Never write a hex value in a component. Never write `bg-zinc-900`, `text-white`,
  `border-neutral-800`, or any Tailwind palette colour.
- Use the semantic utility (`bg-surface`) or `text-[var(--ink-2)]` when you need a
  token Tailwind has no utility for.
- Adding a colour means adding a token to `@theme` **and** binding it in every
  direction's CSS. If you can't name it semantically, you don't need it.

---

## 2. Directions

Each direction is a self-contained visual argument. Do not blend them.

### `.d1` — "Cold Room" (`app/d1/d1.css`) — BUILT
A readout. Near-black ground, hairline rules, teal signal, amber caution, red for
expensive. Everything is measured, dated, and carries a channel identifier.
Nothing decorative that is not also carrying information.

- Type: Archivo (variable `wdth` axis) + Martian Mono. Headlines run at `wdth 62`
  so they can be enormous and still fit. One family, two voices.
- Roles: `.d1-display` `.d1-display-loose` `.d1-label` `.d1-figure` `.d1-body`
- Structure: `.d1-shell` (max 96rem) · `.d1-sechead` · `.d1-grid-bg` · `.d1-ticked`
- Controls: `.d1-field` `.d1-select` `.d1-seg` `.d1-btn` `.d1-btn-ghost` `.d1-link`
- The segmented GPU-count control (`.d1-seg`) is the most important input on the
  site — it is the largest and the only one with a filled selected state. Keep it that way.

### `.d2` — "Ledger" (`app/d2/d2.css`) — CSS + FONTS ONLY, NO PAGES YET
Issue 01 of a prospectus, not a website. Warm paper, ink black, ledger red for
figures needing attention, a real footnote apparatus. The reason it exists: a
technical buyer's objection to a new provider is *evidentiary*, not aesthetic.
A page that behaves like a document answers that objection with its form.

- Type: Instrument Serif (display, one weight — size and space do the emphasis,
  never bold) + Newsreader (`opsz` axis wired up) + Spline Sans Mono (figures).
- Roles: `.d2-display` `.d2-prose` `.d2-standfirst` `.d2-caps` `.d2-figure` `.d2-fn`
- Structure: `.d2-shell` (84rem) · `.d2-page` (7rem marginal column ≥1024) ·
  `.d2-measure` (34rem ≈ 66ch) · `.d2-columns` · `.d2-dropcap` · `.d2-leader`
- Controls: `.d2-input` (ruled line, not a box) `.d2-choice` `.d2-btn` `.d2-link`
- Ledger: `.d2-table` `.d2-num` (right-aligned) `.d2-row-ours` `.d2-stamp`

`components/d2/` has Chapter, Chrome, Cite, Cover, Cta, Footnotes, Ledger,
RateScale, Reveal. Missing: `app/d2/layout.tsx` and `app/d2/page.tsx`.
Mirror `app/d1/layout.tsx` when building them.

---

## 3. Content and identity — zero hardcoded strings

- Components import copy **only** from `@/content` (barrel: `content/index.ts` →
  sources, hardware, operator, pricing, form, copy, legal).
- All names/URLs/handles read from `config/site.ts`. The company name is **not
  final** (`Cluer` vs `Ozark Compute`). Never type the name into a component.
  Rename = edit `SITE.name` only, then `npm run verify:identity`.
- A figure changes in `content/` once, and every direction picks it up.

---

## 4. Accessibility — non-negotiable

- Contrast is documented inline in each direction's CSS with measured ratios.
  Body text ≥ 4.5:1. Keep the comment accurate if you change a value.
- `--rule` / `--rule-strong` are **decorative separators only**.
  `--edge` is the ONLY border permitted on an interactive control (needs ≥ 3:1).
- Focus rings are never removed, only styled. `:focus-visible` → 2px `var(--focus)`.
  `:focus:not(:focus-visible)` → none. Both already handled globally.
- Every page has a `.skip-link` and a `#main` target.
- Comparable figures carry `data-figure` or `.tnum` → tabular lining numerals.

---

## 5. Motion — the base state is the finished state

This is the rule most likely to be broken. Read it twice.

- Keyframes animate **from** an offset, with `backwards`, and **no fill-mode
  forwards**. The element's resting CSS is its final state.
- Consequence: a JS failure cannot hide the headline; the headline paints on the
  first frame and can be the LCP element.
- Never gate content visibility on JS. Never `opacity: 0` as a base state.
- `prefers-reduced-motion` is a hard global stop in `globals.css`, and
  `[data-reveal]` is forced to `opacity:1; transform:none`. Any new reveal must
  survive that, which it will if the base state is the final state.
- Total hero choreography stays under ~700ms.
- Easing tokens: `--ease-out-expo` `--ease-in-out-quint` `--ease-mech`.
- Lenis owns scrolling. Do not add `scroll-behavior: smooth` anywhere.

---

## 6. Visual review loop

```
PORT=4310 npm run dev
node scripts/shot.mjs /d1 d1-hero 1440 900
node scripts/shot.mjs /d1 d1-full 1440 900 --full      # walks the page, fires reveals
node scripts/shot.mjs /d1 d1-reduced 1440 900 --reduce # reduced-motion resting state
node scripts/shot.mjs /d1 d1-nojs 1440 900 --nojs      # JS-off; content must be there
node scripts/shot.mjs /d1 d1-form 1440 900 --at=#reserve
```

Output → `shots/`. The script also reports console errors and horizontal
overflow. **Look at the screenshot before claiming a change is done.**

Ship gate for any visual change: `--reduce` and `--nojs` both still legible,
`hasHorizontalOverflow: false` at 390 / 768 / 1440.

---

## 7. Before you finish

- [ ] `npm run typecheck` and `npm run lint` clean
- [ ] No hex values or Tailwind palette colours added to a component
- [ ] New strings live in `content/`, not in JSX
- [ ] Loading, empty, error and disabled states exist for every new control
- [ ] Screenshotted at 390 / 768 / 1440, plus `--reduce` and `--nojs`
- [ ] Focus ring visible on every new interactive element, keyboard-tested

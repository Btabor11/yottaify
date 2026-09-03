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
  `border-neutral-800`, or any Tailwind palette colour. The one exception is
  `components/d3/palette.ts` — see section 2.
- Use the semantic utility (`bg-surface`) or `text-[var(--ink-2)]` when you need a
  token Tailwind has no utility for.
- Adding a colour means adding a token to `@theme` **and** binding it in every
  direction's CSS. If you can't name it semantically, you don't need it.

---

## 2. The direction — `.d3` "Substation"

One direction ships. D1 "Cold Room" and D2 "Ledger" were built, reviewed and
dropped; they are recoverable from git history at commit `9745956` and nothing
about them remains in the working tree.

Kinetic, saturated, high-voltage. `--accent` is a live `color-mix` driven by
scroll position through `--phase`, so the page travels from a cold pole to a
warm one as you move down it.

- Root class `.d3` on the route-group layout; tokens in `app/(site)/d3.css`.
- Type roles: `.d3-display` `.d3-body` `.d3-figure` `.d3-tag` `.d3-pip`
- Structure: `.d3-panel` `.d3-ticks` and the bay sections in `components/d3/`
- WebGL scenes mount through `components/shared/SceneMount.tsx`, which gates on
  reduced motion and WebGL support and renders a static still otherwise.

**The class and folder are still named `d3`.** That is a deliberate deferral,
not an oversight — renaming `.d3` touches the CSS, `palette.ts`, `audit.mjs`
and every component, and was not worth doing without a build to verify against.
Rename it in one pass, or leave it; do not half-rename it.

### Scene palettes are the one place colour is a literal

`components/d3/palette.ts` holds hex values because WebGL cannot read CSS
variables. Every entry that mirrors a token carries a `/* --token */` comment,
and `scripts/audit.mjs` fails if the two drift apart. This is the only
sanctioned exception to section 1 — do not create another one.

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

## 6. Verification

Static gate — no browser, no dev server, runs in seconds:

```
npm run verify        # typecheck + lint + audit + verify:identity + verify:schema
```

`npm run audit` is the design-system enforcer: 14 checks covering hardcoded
colour, palette/token drift, price and spec literals in components, forbidden
price superlatives, the company name appearing outside config, source
completeness, motion resting states, and the form working without JS.

Browser checks — need `PORT=4310 npm run dev` in another terminal:

```
npm run shot -- / home 1440 900 --full     # walks the page, fires reveals
npm run shot -- / home-reduced 1440 900 --reduce
npm run shot -- / home-nojs 1440 900 --nojs
npm run check:drift                        # does the scroll palette still travel
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
- [ ] Loading, empty, error and disabled states exist for every new control
- [ ] Screenshotted at 390 / 768 / 1440, plus `--reduce` and `--nojs`
- [ ] Focus ring visible on every new interactive element, keyboard-tested

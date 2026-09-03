# Launch blockers

Run `npm run verify:identity` to re-check the mechanical items in this list.
Nothing here is a bug — these are placeholders the codebase deliberately left
visible rather than inventing values for. That was the right call. They now
need real values.

## Blocking — the site cannot go live with these

| # | Item | Where | Note |
|---|---|---|---|
| 1 | Company name undecided | `config/site.ts` → `SITE.name` | `Cluer` vs `Ozark Compute`. Drives the logo monogram (derived from `shortName`), `<title>`, OG tags, footer and form copy. Everything downstream of this is provisional until it is settled. `verify:identity` confirms no other file hardcodes it, so the rename itself is a one-line change. |
| 2 | Domain is `example.com` | `config/site.ts` → `domain` | Not registered. Breaks canonical URLs, OG image resolution, and every absolute link. |
| 3 | Placeholder email addresses | `config/site.ts` → `email.sales`, `email.general` | `reservations@example.com` / `hello@example.com`. The reservation form's confirmation copy points at these. |
| 4 | Reservation endpoint unset | `.env` → `NEXT_PUBLIC_RESERVATION_ENDPOINT` | Unset falls back to a local stub that logs and resolves success. **A visitor would get a success message and you would never receive the lead.** Highest-consequence item on this list. |
| 5 | Site URL unset | `.env` → `NEXT_PUBLIC_SITE_URL` | Falls back to `https://${domain}` — i.e. example.com. |

## Should fix before launch

| # | Item | Where | Note |
|---|---|---|---|
| 6 | `legalName` not verified | `config/site.ts` | Placeholder until entity formation completes. It appears in the legal pages, where an inaccurate legal name is worse than a generic one. |
| 7 | Analytics unconfigured | `.env` → `NEXT_PUBLIC_ANALYTICS_PROVIDER`, `_DOMAIN` | Unset = no-op, which is a safe default. Decide before launch or you lose the launch-day data permanently. |
| 8 | No social handles | `config/site.ts` → `social` | All empty, so the links do not render. Correct behaviour — but decide whether that is intentional at launch. |
| 9 | `d3` is declared but may not exist | `config/site.ts` → `DIRECTIONS`, `frontRunner` type | `DIRECTIONS` lists `d3` "Substation", and `frontRunner` is typed `"d1" \| "d2" \| "d3"`. Confirm `app/d3/` exists before launch or the direction switcher links to a 404. |
| 10 | Source citation is wrong on five specs | `content/sources.ts` | See `SOURCE-AUDIT.md` **A1**. The cited NVIDIA page does not contain the figures attributed to it. On this site specifically, that is a launch blocker for credibility. |
| 11 | Price floor claim is contested | `content/pricing.ts` | See `SOURCE-AUDIT.md` **A3**. |

## Pre-launch verification

```
npm run verify:identity      # no hardcoded names; lists remaining placeholders
npm run typecheck
npm run lint
npm run build                # catches the things dev mode forgives

PORT=4310 npm run dev
node scripts/shot.mjs /d1 launch-d1 1440 900 --full
node scripts/shot.mjs /d1 launch-d1-reduced 1440 900 --reduce
node scripts/shot.mjs /d1 launch-d1-nojs 1440 900 --nojs
node scripts/shot.mjs /d1 launch-d1-mobile 390 844 --full
```

Check `hasHorizontalOverflow: false` at 390 / 768 / 1440, and that the
`--nojs` capture still shows the headline and the price table. The motion
contract in `DESIGN.md` guarantees this — the screenshots prove it.

## Before the reservation form goes live

Submit one real reservation end to end and confirm it arrives where you expect.
Item 4 fails silently by design in dev, which means a broken production
endpoint looks identical to a working one from the visitor's side.

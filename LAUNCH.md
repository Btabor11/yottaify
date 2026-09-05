# Launch blockers

Run `npm run verify:identity` to re-check the mechanical items in this list.
Nothing here is a bug — these are placeholders the codebase deliberately left
visible rather than inventing values for. That was the right call. They now
need real values.

## Blocking — the site cannot go live with these

| # | Item | Where | Note |
|---|---|---|---|
| 1 | Company name settled | `config/site.ts` → `SITE.name` | Front-of-house name is `Yottaify`. Monogram, `<title>`, OG tags, footer and form copy all read from here. `legalName` is the same string until entity formation completes — see item 6. |
| 2 | Domain is `yottaify.com` | `config/site.ts` → `domain` | Config points here. DNS, TLS, and the production `NEXT_PUBLIC_SITE_URL` still have to match or canonical URLs and OG images resolve to the wrong host. |
| 3 | Email addresses | `config/site.ts` → `email.sales`, `email.general` | `reservations@yottaify.com` / `hello@yottaify.com`. Mailboxes, SPF/DKIM, and `MAIL_FROM` still have to exist. The reservation form's confirmation copy points at these. |
| 4 | Database unset | `.env` → `DATABASE_URL` | The form now posts to the built-in pipeline (`/api/reservation`) and stores every lead. Unset, it stores to JSON files under `.data/` — fine on a laptop, **wiped on every Vercel deploy or cold start.** Provision Postgres (Neon recommended), set the URL, run `npm run db:push`. See `DATA.md`. Highest-consequence item on this list. |
| 4a | Email delivery unset | `.env` → `RESEND_API_KEY`, `MAIL_FROM` | Without it no receipt reaches the client and no notification reaches sales; the lead is still stored and visible at `/admin`. Verify the sending domain in Resend first. |
| 4b | Admin desk unset | `.env` → `ADMIN_USER`, `ADMIN_PASSWORD` | `/admin` answers 404 until both are set. Long random password; HTTPS only. |
| 5 | Site URL unset | `.env` → `NEXT_PUBLIC_SITE_URL` | Falls back to `https://${domain}` — i.e. yottaify.com. |
| 5a | IP hash salt unset | `.env` → `IP_HASH_SALT` | `lib/server/reference.ts` falls back to `"dev-salt-not-for-production"`. With a known salt the "one-way" hash is brute-forceable over the IPv4 space, which makes the privacy policy's "we cannot recover the address" untrue. Generate 32+ random bytes. |
| 5b | Retention not set | `content/data-inventory.ts` → `RETENTION` | The privacy policy is now generated from the schema (`PRIVACY_DRAFT`, adopted in `content/legal.ts`) and lists every column. Retention per category is `null` and renders as "not yet set", which is true. Decide the numbers; the policy updates itself. Deletion on request is implemented (`/admin` → erase). |

## Should fix before launch

| # | Item | Where | Note |
|---|---|---|---|
| 6 | `legalName` not verified | `config/site.ts` | Placeholder until entity formation completes. It appears in the legal pages, where an inaccurate legal name is worse than a generic one. |
| 7 | Analytics unconfigured | `.env` → `NEXT_PUBLIC_ANALYTICS_PROVIDER` | Unset = no-op. `firstparty` writes events to your own database with no third party and no cookie, and is what the privacy policy describes. Decide before launch or you lose the launch-day data permanently. |
| 7a | Webhook unset | `.env` → `RESERVATION_WEBHOOK_URL` | Optional. A Slack incoming-webhook URL here puts every new reservation in a channel the moment it lands. |
| 8 | No social handles | `config/site.ts` → `social` | All empty, so the links do not render. Correct behaviour — but decide whether that is intentional at launch. |
| 10 | Source citation is wrong on five specs | `content/sources.ts` | See `SOURCE-AUDIT.md` **A1**. The cited NVIDIA page does not contain the figures attributed to it. On this site specifically, that is a launch blocker for credibility. |
| 11 | Price floor claim is contested | `content/pricing.ts` | See `SOURCE-AUDIT.md` **A3**. |

## Pre-launch verification

```
npm run verify:identity      # no hardcoded names; lists remaining placeholders
npm run typecheck
npm run lint
npm run build                # catches the things dev mode forgives

npm run build && PORT=4310 npm run start
node scripts/shot.mjs / launch 1440 900 --full
node scripts/shot.mjs / launch-reduced 1440 900 --reduce
node scripts/shot.mjs / launch-nojs 1440 900 --nojs
node scripts/shot.mjs / launch-mobile 390 844 --full
node scripts/shot.mjs "/?reservation=received&ref=R-TEST00" launch-received 1440 900 --at=#reserve
node scripts/shot.mjs /admin launch-admin 1440 900 --auth=USER:PASS
```

Check `hasHorizontalOverflow: false` at 390 / 768 / 1440, and that the
`--nojs` capture still shows the headline and the price table. The motion
contract in `DESIGN.md` guarantees this — the screenshots prove it.

## Before the reservation form goes live

Submit one real reservation end to end on the production deploy and confirm:

1. The success panel shows a reference code (`R-XXXXXX`).
2. The row is on `/admin` with its visit context filled in.
3. The receipt email arrived at the address you used; the notification arrived
   at `NOTIFY_TO`.
4. The optional follow-up saves and the row's "Follow-up answers" fills in.
5. `curl -u USER:PASS https://<site>/admin/export` returns the row.

Then erase the test record from its detail page. If step 2 works and step 3
does not, the lead is safe — check the Resend domain verification. If step 2
fails, check `DATABASE_URL` and the Vercel function logs: the file-store
fallback will have accepted the submission and then lost it.

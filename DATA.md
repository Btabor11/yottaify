# Data: what is collected, where it lives, how to stand it up

The site's job is to turn a visitor into a reservation and to arrive at that
reservation knowing as much as the visitor was willing to tell us — plus
everything the visit itself can tell us without asking. This document is the
map of that data. The privacy policy is generated from the same schema
(`content/data-inventory.ts`), so the two cannot disagree.

## 1. The shape

Three tables, one Postgres database. Schema is in `lib/server/schema.ts`
(Drizzle ORM); the SQL that creates it is in `drizzle/0000_init.sql`.

### `reservations` — one row per lead

| Group | Columns | Filled by |
|---|---|---|
| Identity | `id` (uuid), `reference` (`R-XXXXXX`, what the client quotes), `created_at`, `updated_at` | server |
| The form | `company`, `name`, `email`, `email_domain`, `gpu_count`, `start_date`, `workload`, `notes` | client, required except notes |
| The follow-up | `role`, `phone`, `team_size`, `current_provider`, `current_spend`, `term_interest`, `duration_months`, `storage_needs`, `data_movement`, `compliance[]`, `decision_timeframe`, `heard_from`, `dealbreakers`, `followup_at` | client, all optional, asked after the reservation is in |
| Visit context | `path`, `landing_path`, `referrer`, `utm_*` (5), `user_agent`, `ip_hash`, `country`, `region`, `city`, `locale`, `timezone`, `viewport_w/h`, `screen_w/h`, `dpr`, `device_class`, `reduced_motion`, `color_scheme`, `js_enabled`, `session_id` | captured silently |
| Behaviour | `time_on_page_ms`, `form_fill_ms`, `validation_failures`, `estimator_gpus`, `estimator_hours`, `sections_viewed[]`, `pages_viewed[]`, `source_clicks` | captured silently |
| Pipeline | `status`, `tier` (A/B/C), `score`, `spam`, `spam_reason`, `owner`, `internal_notes`, `receipt_sent_at`, `notify_sent_at`, `webhook_sent_at`, `idempotency_key` | server / admin |

Every column has a stated purpose in `content/data-inventory.ts`. Adding a
column without describing it there fails `npm run typecheck`.

### `reservation_events` — the audit trail

Append-only. One row per thing that happened to a reservation: `created`,
`status_changed`, `followup_received`, `receipt_sent`/`receipt_failed`,
`notify_sent`/`notify_failed`, `webhook_sent`/`webhook_failed`, `note_added`,
`owner_changed`, `flagged_spam`. Each carries an `actor` (`client`, `system`,
`admin`) and a JSON payload. Cascades on delete.

### `events` — first-party analytics

Only written when `NEXT_PUBLIC_ANALYTICS_PROVIDER=firstparty`. Page views,
section views, estimator use, source-link clicks, FAQ opens, form start,
submit, follow-up. Keyed by a `session_id` that lives in the browser's
`sessionStorage` and dies with the tab. Carries no name or email. It joins to
a reservation only when the same session submits the form.

## 2. Where it lives

```
DATABASE_URL set    →  Postgres (lib/server/store-pg.ts)
DATABASE_URL unset  →  JSON files under .data/ (lib/server/store-file.ts)
```

The two implement the same `Store` interface (`lib/server/store-shared.ts`).
The API routes, the pipeline and the admin never know which one they have.

**The file store is for laptops.** It exists so the whole system — receipt,
reference, follow-up, admin desk, CSV export — runs with zero setup, and so a
misconfigured database in production degrades to "leads on disk" rather than
"leads gone". Vercel's filesystem is ephemeral: a deploy or a cold start
wipes it. Set `DATABASE_URL` before the form takes real traffic.

### Recommended: Neon Postgres

Serverless Postgres with branching, a free tier that fits this traffic for a
long time, and a plain connection string — nothing here is Neon-specific, so
Supabase, RDS, Railway or a box in the facility all work identically.

```bash
# 1. Create a project at neon.tech, copy the pooled connection string.
# 2. Put it in .env.local (dev) and the Vercel project env (prod).
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require

# 3. Create the tables.
npm run db:push            # fresh database: apply the schema directly
#   or, for a database with history:
npm run db:migrate         # apply drizzle/*.sql in order

# 4. Look at it.
npm run db:studio          # Drizzle Studio, local browser UI over the live DB
```

`npm run db:generate` writes a new migration after a schema change. Commit
the `drizzle/` folder.

### Backups and export

- Neon keeps point-in-time restore (7 days on the free tier, 30 on paid).
- `GET /admin/export` returns every non-spam row as CSV. Behind the same
  Basic auth as the desk, so `curl -u user:pass https://<site>/admin/export`
  can feed a spreadsheet, a CRM import or a nightly cron.
- `RESERVATION_WEBHOOK_URL` mirrors every new reservation as JSON to a Slack
  channel, Zapier, Make, or a CRM's inbound webhook, the moment it lands.

## 3. The pipeline

```
browser ──POST /api/reservation──▶ validate (zod, lib/validation.ts)
                                    │
                                    ├─ parse context (lib/server/context.ts)
                                    ├─ rate limit per IP (lib/server/ratelimit.ts)
                                    ├─ idempotency: same submissionId → same row
                                    ├─ spam heuristics: honeypot, fill time, bot UA,
                                    │    URL in name field — flagged, never rejected
                                    ├─ score → tier A/B/C (lib/server/score.ts)
                                    ├─ INSERT reservations + 'created' event
                                    └─ 201 { reference }
                                         │
                            after() ─────┴─▶ receipt email to client   (Resend)
                                            notification to sales     (Resend)
                                            webhook                    (optional)
                                            each logged as an event, failure too

browser ──POST /api/reservation/followup──▶ auth = reference + email
                                             UPDATE the row, re-score, event

browser ──sendBeacon /api/event──▶ batched analytics rows (firstparty only)
```

Everything works with JavaScript off: the form and the follow-up are native
`<form method="post">`, the API answers a 303 back to the page with flags in
the query string, and the reference code is shown from the URL.

### Spam is flagged, not rejected

A submission that trips a heuristic is stored with `spam=true` and a reason,
returns the same success response, and is hidden from the default admin view.
The desk can un-flag it in one click. This is deliberate: a false positive
that silently drops a real lead costs more than a hundred spam rows.

## 4. Reading it

`/admin` — the reservation desk. `ADMIN_USER` and `ADMIN_PASSWORD` must both
be set or the route answers 404. Browsers are sent to `/admin/login`, which
sets a twelve-hour session cookie; scripts can use HTTP Basic auth directly
(`curl -u USER:PASS …/admin/export`). Same credentials either way.

- Board: totals, open pipeline, GPUs requested, breakdowns by status / tier /
  capacity / workload / target month / source. Filter by status, tier, text.
- Detail: everything above, in plain language, with the timeline. Set
  status, owner, internal notes; flag or un-flag spam; erase the record
  (deletion request — requires re-typing the reference).
- Export: CSV, all columns.

One shared credential is right-sized for one team. Before more than a handful of people
need it, put the route behind a real identity provider.

## 5. Rich data, without being creepy

- **IP is never stored.** Only a salted SHA-256 (`IP_HASH_SALT`). Enough to
  rate-limit and spot duplicates; not enough to identify anyone.
- **No cookies.** The session id is `sessionStorage`, gone when the tab closes.
- **The follow-up is asked, not inferred.** The rich fields — spend band,
  current provider, compliance needs, decision timeframe, dealbreakers — come
  from the client, after they have committed, framed as making their own call
  shorter. Form conversion is protected by keeping the first form to six
  fields.
- **The policy is generated from the schema.** `content/data-inventory.ts`
  describes every column; `content/legal.ts` renders it. Two decisions are
  still open there and render honestly as open: `RETENTION` (days per
  category) and — now closed — `DELETION` (implemented in the admin).

## 6. Environment reference

See `.env.example`. Nothing is required for local development.

| Variable | Effect when unset |
|---|---|
| `DATABASE_URL` | file store under `.data/` |
| `RESEND_API_KEY` | no email; reservation still stored, event logged as `mode: logged` |
| `MAIL_FROM`, `NOTIFY_TO` | fall back to `SITE.email.*` in `config/site.ts` |
| `RESERVATION_WEBHOOK_URL` | no webhook |
| `ADMIN_USER`, `ADMIN_PASSWORD` | `/admin` answers 404 |
| `IP_HASH_SALT` | dev salt — set in production |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | no analytics |

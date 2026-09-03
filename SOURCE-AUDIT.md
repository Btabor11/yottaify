# Source audit — 3 Sep 2026

Independent check of every claim in `content/sources.ts`, `content/pricing.ts`
and `content/hardware.ts` against public sources. Nothing in `content/` was
edited — this is findings only.

Severity: **A** = fix before launch (undermines the evidentiary argument)
· **B** = should fix · **C** = note.

---

## A1 — Five hardware specs cite a page that does not contain them

`sourceId: "nvidiaBlackwellUltra"` points at
`nvidia.com/en-us/data-center/technologies/blackwell-architecture/`.
That page is reachable (200) but publishes **none** of the figures attributed
to it. It states only "50x better performance / 35x lower cost for Agentic AI"
and "2X attention-layer acceleration, 1.5X more AI compute FLOPS".

Affected: `bandwidth` (8 TB/s), `fp4` (14–15 PFLOPS), `nvlink` (1.8 TB/s),
`sms` (160), and `hbm` (288 GB).

This is the one failure mode the site is built to avoid: a footnote that does
not carry the number it is attached to. A technical buyer who clicks through
finds nothing, and every other citation on the page loses credibility with it.

**The numbers are right — the citation is wrong.** NVIDIA's GB300 NVL72 spec
table substantiates them directly, per-GPU = rack ÷ 72:

| Spec | NVIDIA rack figure (72 GPUs) | ÷ 72 | Site claim | |
|---|---|---|---|---|
| Memory bandwidth | 576 TB/s | 8.0 TB/s | ~8 TB/s | ✅ exact |
| NVLink per GPU | 130 TB/s | 1.806 TB/s | ~1.8 TB/s | ✅ exact |
| Dense FP4 | 1,080 PFLOPS dense | 15 PFLOPS | ~14–15 PFLOPS | ✅ conservative |
| HBM3e | 20 TB | ~288 GB | 288 GB | ✅ |

**Fix:** repoint `nvidiaBlackwellUltra.url` to
`https://www.nvidia.com/en-us/data-center/gb300-nvl72/` and add to its `note`
that per-GPU figures are the published rack figures divided by 72. That is the
same divide-and-say-so convention `METHODOLOGY` already uses for per-instance
cloud pricing, so it fits the page's existing voice.

Corroborating (not primary): NVIDIA's own developer blog states "up to 288 GB
of HBM3e memory per GPU". Tom's Hardware confirms 288 GB and 15 PFLOPS dense FP4.

---

## A2 — `sms: 160` cannot be sourced anywhere

No NVIDIA page, datasheet, or reputable secondary source publishes an SM count
for B300. It is the only spec on the page with no verifiable origin.

Its stated value to a buyer is also the weakest ("occupancy budget for custom
kernels, if you write them").

**Fix:** delete the row. On a page whose argument is "every number is sourced,"
one unsourceable number costs more than it earns.

---

## A3 — "$7.89 is the cheapest verifiable in-stock rate" is contested

This is the load-bearing claim of the entire price argument, and two
aggregators disagree with it as of today:

- **gpufinder.dev:** "the cheapest single B300 confirmed in stock is **$7.85
  per GPU-hour on Nebius**" (uk-south1, hourly stock check). That is *below*
  the site's verified floor.
- **getdeploying.com:** lists **Runpod $6.94–7.89 as in stock**. gpufinder lists
  the same Runpod $6.94 as "out of capacity." If Runpod at $6.94 is bookable
  anywhere, the "sub-$7 is phantom capacity" thesis fails outright.

Your methodology (reaching a checkout or quote step) is stronger evidence than
an aggregator's scrape, so you may well be right. But the claim is now
falsifiable by anyone with a browser and a minute, which is precisely the
audience this page is written for.

**Fix:** either re-run the in-stock check on Nebius and Runpod and move the
floor, or narrow the claim to what you actually tested — e.g. "the cheapest
rate we reached a bookable checkout on, on <date>" — and name the providers
checked. A dated, scoped claim survives contradiction; an absolute one does not.

---

## B1 — The $6.95–$7.85 band is missing from the table

Published listings sitting in the gap the narrative jumps over:

| Provider | Rate | Source |
|---|---|---|
| Gcore | $6.97 | getdeploying |
| Modal | $7.10 | Thunder Compute |
| Hyperstack | $7.40 | getdeploying |
| Verda | $7.50 | gpufinder |

`PRICE_ROWS` goes from "neocloud low end $6.50–6.95" straight to "lowest
verified $7.89". Four listings in between are unrepresented. The page's own
`METHODOLOGY` says the aggregate is "across the providers we track" — but a
buyer comparing against any aggregator sees a gap exactly where the argument
needs one.

**Fix:** add a mid-band row ("$6.97–7.50, several providers, unverified") or
widen `neocloud-low` to `$6.50–7.50`. Showing the crowded middle makes the
availability argument stronger, not weaker — it's more listings you couldn't book.

---

## B2 — "Lowest verified" sits *above* "median" on the chart

`verified-low` = $7.89 but `median` = $7.85–7.87. The bar labelled "lowest
verified in stock" will render taller than the bar labelled "median on-demand,"
which reads as an error even though it is arithmetically possible (the median
includes unverified listings).

getdeploying independently computes the **median at $7.89** — identical to your
verified floor, which would remove the inversion.

**Fix:** recheck the median. If it is $7.89, the two rows collapse into one
much cleaner fact: *the median listed price and the cheapest bookable price are
the same number.* That is a sharper sentence than either row alone.

---

## B3 — Spot pricing undercuts the committed-terms row

`committed` claims $4.25–5.62 for 24–60 month terms. Nebius currently lists
**B300 spot from $4.30/GPU-hr** (~45% off on-demand), available today with no
commitment. A buyer will ask why they should sign 24 months for a rate they can
get on spot this afternoon.

**Fix:** add one line to the row's `note` distinguishing committed capacity
(guaranteed, non-preemptible) from spot (interruptible). The distinction is
real and favours you; leaving it unstated looks like an omission.

---

## C1 — `tdp` is attributed to `facility` (first-party)

`1,000–1,400 W` is NVIDIA's configurable TDP range, not something measured on
your build. The `why` text is genuinely first-party ("we hold headroom"), so
the row is doing two jobs. Consider splitting the vendor range from your
operating policy, or noting both source kinds.

## C2 — Source URLs are live

All three external URLs returned 200 on 3 Sep 2026:
Oracle price list · AWS EC2 on-demand · NVIDIA Blackwell architecture.
(The NVIDIA one is reachable but wrong for the purpose — see A1.)

## C3 — Hyperscaler rates confirm cleanly

**Oracle $15.00** and **AWS $17.80** per GPU-hour both match independent
aggregators exactly. Two of the strongest numbers on the page. No action.

## C4 — `accessed` dates will go stale fastest

Every source is dated `2026-09-02`. `METHODOLOGY` promises "if a figure here is
stale, it is stale with a visible timestamp." Worth a calendar reminder to
re-run the survey monthly — the dates are the mechanism that makes the honesty
claim true rather than decorative.

---

## Verified with no changes needed

- 288 GB HBM3e per GPU — NVIDIA developer blog, verbatim
- 8 TB/s bandwidth — derives exactly from NVIDIA's 576 TB/s ÷ 72
- 1.8 TB/s NVLink 5 per GPU — derives exactly from 130 TB/s ÷ 72
- 14–15 PFLOPS dense NVFP4 — NVIDIA's 1,080 dense ÷ 72 = 15; your range is conservative
- 2,304 GB per 8-GPU node — arithmetic, computed in code, correct
- Oracle $15.00 · AWS $17.80 — confirmed by two independent aggregators
- $6.50 low-end listing — confirmed (Bentaus, listed unverified) — matches your framing
- Supply constraint framing — corroborated: "much of the B300 capacity is
  committed to large enterprise customers and long-term contracts, so on-demand
  supply for smaller teams is thin"

## Sources consulted

- getdeploying.com/gpus/nvidia-b300 — 27+ provider comparison
- gpufinder.dev/gpu/b300 — hourly stock checks
- thundercompute.com/blog/nvidia-b300-pricing — Sept 2026 pricing
- nvidia.com/en-us/data-center/gb300-nvl72/ — rack spec table
- developer.nvidia.com/blog/nvidia-blackwell-ultra-for-the-era-of-ai-reasoning
- tomshardware.com — B300 announcement specs
- spheron.network/blog/nvidia-b300-blackwell-ultra-guide/

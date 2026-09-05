import { fetchJson, fetchText, ldJson, money } from "../http";
import { evidence, obs, type Source } from "./base";
import { SOURCE_META } from "../catalog";
import type { Observation, ProviderId, StockSignal, Term } from "../types";

/* ---------------------------------------------------------------------------
   TRACKERS — what third-party aggregators REPORT.

   These rows are never shown as a provider's price. They are shown as
   "as reported by <tracker>", beside the provider's own figure, so the reader
   can see the gap. Two trackers are listed but not read; the reasons are on
   the page.
--------------------------------------------------------------------------- */

/** Tracker slugs → our canonical provider ids. Unknown slugs become "other". */
const SLUG: Record<string, ProviderId> = {
  runpod: "runpod", "vast-ai": "vast", vast: "vast", "vast.ai": "vast", nebius: "nebius", hyperstack: "hyperstack",
  modal: "modal", aws: "aws", "amazon-web-services": "aws", "oracle-cloud": "oracle", oracle: "oracle", coreweave: "coreweave",
  "together-ai": "together", lambda: "lambda", "lambda-labs": "lambda", "gpu-ai": "gpu-ai", spheron: "spheron", bentaus: "bentaus",
  gcore: "gcore", lyceum: "lyceum", verda: "verda", "massed-compute": "massed-compute", scaleway: "scaleway", "latitude-sh": "latitude",
  enverge: "enverge", "fal-ai": "fal", "prime-intellect": "prime-intellect", primeintellect: "prime-intellect", datacrunch: "datacrunch",
  lium: "lium", sesterce: "sesterce", "theai-cloud": "theai-cloud", "impossible-cloud": "impossible-cloud",
};

export function providerFromSlug(s: string): ProviderId {
  const k = s.toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-");
  return SLUG[k] ?? (Object.entries(SLUG).find(([slug]) => k.includes(slug))?.[1] ?? "other");
}

// --- getdeploying -----------------------------------------------------------------

const GD_AVAIL: Record<string, StockSignal> = { "0": "in-stock", "1": "waitlist", "2": "not-reported", "3": "out-of-stock" };

export const getdeploying: Source = {
  meta: SOURCE_META.getdeploying,
  async fetch() {
    const f = await fetchText("https://getdeploying.com/gpus/nvidia-b300");
    const out: Observation[] = [];

    // Summary stat
    const stat = f.body.match(/(\d+)\s+of\s+(\d+)\s+configs in stock/);
    const provCount = f.body.match(/(\d+)\s+providers</);
    if (stat) {
      out.push(obs({
        source: this.meta, provider: "other", variant: `in-stock:${stat[1]}:${stat[2]}:${provCount?.[1] ?? ""}`, term: "on-demand",
        usdPerGpuHour: null, fetchability: "ok", stock: "not-reported", evidence: evidence(f, stat[0]),
      }));
    }

    // Per-provider blocks are introduced by id="configs-{slug}"; rows are <tr data-billing data-pricegpu data-availability>.
    const chunks = f.body.split(/\sid="configs-/).slice(1);
    if (!chunks.length) throw new Error("no configs-* blocks found — markup changed");
    for (const chunk of chunks) {
      const slug = chunk.match(/^([a-z0-9-]+)"/)?.[1];
      if (!slug) continue;
      const provider = providerFromSlug(slug);
      const block = chunk.slice(0, chunk.indexOf("</table>") > 0 ? chunk.indexOf("</table>") : undefined);
      for (const tr of block.matchAll(/<tr[^>]*data-billing="(\d+)"[^>]*>/g)) {
        const tag = tr[0];
        const billing = tr[1];
        if (billing !== "100") continue; // on-demand only
        const price = money(tag.match(/data-pricegpu="([\d.]+)"/)?.[1]);
        const avail = tag.match(/data-availability="(\d)"/)?.[1] ?? "2";
        if (price == null) continue;
        const gpus = Number(tag.match(/data-gpus="(\d+)"/)?.[1] ?? 1);
        out.push(obs({
          source: this.meta, provider, variant: `${slug} ${gpus}x`, term: "on-demand", usdPerGpuHour: price, gpusPerUnit: gpus,
          stock: GD_AVAIL[avail] ?? "not-reported", stockBasis: "tracker-checked", evidence: evidence(f, `id="configs-${slug}"`),
        }));
      }
    }
    // The page repeats some blocks (desktop and narrow layouts); one row per distinct fact.
    const seen = new Set<string>();
    return out.filter((o) => {
      const k = `${o.provider}|${o.variant}|${o.usdPerGpuHour}|${o.stock}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  },
};

// --- computeunion -------------------------------------------------------------------

interface CuRow { platform_slug: string; platform_name: string; price_usd: number; availability?: string; availability_pct?: number; region?: string; scraped_at?: string }

export const computeunion: Source = {
  meta: SOURCE_META.computeunion,
  async fetch() {
    const out: Observation[] = [];
    for (const slug of ["gpu-b300", "gpu-nvidia-b300"]) {
      const f = await fetchJson<CuRow[] | { data?: CuRow[] }>(`https://www.computeunion.net/api/gpu-prices?gpu=${slug}`);
      const rows = Array.isArray(f.json) ? f.json : f.json.data ?? [];
      for (const r of rows) {
        if (!r.price_usd) continue;
        const pct = typeof r.availability_pct === "number" ? r.availability_pct / 100 : undefined;
        const stock: StockSignal = pct == null ? "not-reported" : pct >= 0.7 ? "in-stock" : pct >= 0.3 ? "limited" : "out-of-stock";
        out.push(obs({
          source: this.meta, provider: providerFromSlug(r.platform_slug), variant: r.platform_name, term: "on-demand",
          usdPerGpuHour: r.price_usd, region: r.region, stock, stockBasis: pct == null ? undefined : "tracker-heuristic", availabilityPct: pct,
          evidence: evidence(f, `"platform_slug":"${r.platform_slug}"`, r.scraped_at ? `their scrape: ${r.scraped_at}` : undefined),
        }));
      }
    }
    if (!out.length) throw new Error("no rows from either slug");
    return out;
  },
};

// --- gpufinder (HTML only; their API is robots-disallowed for us) ------------------

export const gpufinder: Source = {
  meta: SOURCE_META.gpufinder,
  async fetch() {
    const f = await fetchText("https://gpufinder.dev/gpu/b300");
    const out: Observation[] = [];
    for (const block of ldJson(f.body)) {
      const walk = (n: unknown) => {
        if (!n || typeof n !== "object") return;
        const o = n as Record<string, unknown>;
        if (o["@type"] === "AggregateOffer") {
          const low = money(o.lowPrice as string), high = money(o.highPrice as string);
          if (low != null) out.push(obs({ source: this.meta, provider: "other", variant: `aggregate:low:${o.offerCount ?? ""}`, term: "on-demand", usdPerGpuHour: low, fetchability: "ok", evidence: evidence(f, '"lowPrice"') }));
          if (high != null) out.push(obs({ source: this.meta, provider: "other", variant: `aggregate:high:${o.offerCount ?? ""}`, term: "on-demand", usdPerGpuHour: high, fetchability: "ok", evidence: evidence(f, '"highPrice"') }));
        }
        for (const v of Object.values(o)) if (v && typeof v === "object") walk(v);
      };
      walk(block);
    }
    // "Cheapest B300 confirmed in stock right now: $7.85/GPU-hr on Nebius"
    const m = f.body.match(/confirmed in stock[^$]{0,80}\$([\d.]+)\/GPU-hr on ([A-Za-z0-9 .-]+?)[<.,]/);
    if (m) {
      out.push(obs({ source: this.meta, provider: providerFromSlug(m[2]), variant: `${m[2].trim()} (confirmed in stock)`, term: "on-demand", usdPerGpuHour: money(m[1]), stock: "in-stock", evidence: evidence(f, "confirmed in stock") }));
    }
    if (!out.length) throw new Error("no structured data found");
    return out;
  },
};

// --- declined / unfetchable, listed on purpose --------------------------------------

export const gpusio: Source = {
  meta: SOURCE_META.gpusio,
  async fetch() {
    return [];
  },
};

export const gpucost: Source = {
  meta: SOURCE_META.gpucost,
  async fetch() {
    return [];
  },
};

export const TRACKER_SOURCES: Source[] = [getdeploying, computeunion, gpufinder, gpusio, gpucost];

export type { Term };

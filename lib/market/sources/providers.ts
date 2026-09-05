import { fetchJson, fetchText, ldJson, money, nextData, round } from "../http";
import { evidence, obs, type Source } from "./base";
import { SOURCE_META } from "../catalog";
import type { Observation, StockSignal } from "../types";

/* ---------------------------------------------------------------------------
   PROVIDERS — each seller's own published figure.

   Recipes verified live on 2026-09-04. Each parser anchors on the most stable
   thing available (a data attribute, a label string, a JSON key) and throws
   with a specific message when the anchor is gone, so a silent zero never
   ships as a price.
--------------------------------------------------------------------------- */

// --- RunPod -------------------------------------------------------------------

const RUNPOD_QUERY = `{ gpuTypes(input:{id:"NVIDIA B300 SXM6 AC"}) { id displayName memoryInGb securePrice communityPrice secureSpotPrice communitySpotPrice lowestPrice(input:{gpuCount:1}) { minimumBidPrice uninterruptablePrice stockStatus } } }`;

interface RunpodResp {
  data?: { gpuTypes?: { id: string; securePrice: number | null; communityPrice: number | null; secureSpotPrice: number | null; communitySpotPrice: number | null; lowestPrice?: { stockStatus: string | null } | null }[] };
}

export const runpod: Source = {
  meta: SOURCE_META.runpod,
  async fetch() {
    const f = await fetchJson<RunpodResp>("https://api.runpod.io/graphql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: RUNPOD_QUERY }),
    });
    const g = f.json.data?.gpuTypes?.[0];
    if (!g) throw new Error("gpuTypes[0] missing — SKU id may have changed");
    const stockRaw = g.lowestPrice?.stockStatus ?? null;
    const stock: StockSignal = stockRaw == null ? "unknown" : stockRaw.toLowerCase() === "low" ? "limited" : "in-stock";
    const out: Observation[] = [];
    if (g.securePrice != null)
      out.push(obs({ source: this.meta, provider: "runpod", variant: "Secure Cloud", term: "on-demand", usdPerGpuHour: g.securePrice, stock, evidence: evidence(f, '"securePrice"') }));
    if (g.communityPrice != null)
      out.push(obs({ source: this.meta, provider: "runpod", variant: "Community Cloud", term: "on-demand", usdPerGpuHour: g.communityPrice, stock, evidence: evidence(f, '"communityPrice"') }));
    if (g.secureSpotPrice != null)
      out.push(obs({ source: this.meta, provider: "runpod", variant: "Secure spot", term: "spot", usdPerGpuHour: g.secureSpotPrice, stock, evidence: evidence(f, '"secureSpotPrice"') }));
    return out;
  },
};

// --- Vast.ai ------------------------------------------------------------------

interface VastBundle { id: number; num_gpus: number; dph_total: number; gpu_name: string; geolocation?: string; verification?: string; rentable?: boolean }
interface VastResp { offers?: VastBundle[]; truncated?: boolean }

export const vast: Source = {
  meta: SOURCE_META.vast,
  async fetch() {
    const q = { gpu_name: { eq: "B300" }, rentable: { eq: true }, type: "on-demand", limit: 200, order: [["dph_total", "asc"]] };
    const url = `https://console.vast.ai/api/v0/bundles/?q=${encodeURIComponent(JSON.stringify(q))}`;
    const f = await fetchJson<VastResp>(url);
    const offers = (f.json.offers ?? []).filter((o) => o.gpu_name === "B300" && o.num_gpus > 0 && o.dph_total > 0);
    if (!offers.length) {
      return [obs({ source: this.meta, provider: "vast", term: "on-demand", usdPerGpuHour: null, stock: "out-of-stock", fetchability: "ok", evidence: evidence(f, '"offers"', "no rentable B300 offers at read time") })];
    }
    const perGpu = offers.map((o) => o.dph_total / o.num_gpus);
    const min = Math.min(...perGpu);
    const cheapest = offers[perGpu.indexOf(min)];
    const gpus = offers.reduce((s, o) => s + o.num_gpus, 0);
    return [
      obs({
        source: this.meta, provider: "vast", variant: `cheapest of ${offers.length} offers (${gpus} GPUs listed)`, term: "on-demand",
        usdPerGpuHour: round(min), gpusPerUnit: cheapest.num_gpus, region: cheapest.geolocation, stock: "in-stock",
        evidence: evidence(f, `"id":${cheapest.id}`, `$${cheapest.dph_total} ÷ ${cheapest.num_gpus} GPUs`),
      }),
    ];
  },
};

// --- Nebius -------------------------------------------------------------------

export const nebius: Source = {
  meta: SOURCE_META.nebius,
  async fetch() {
    const f = await fetchText("https://nebius.com/prices");
    // The table lives inside a JSON string inside Apollo state; find it by content, not by key.
    const nd = nextData<{ props?: { pageProps?: { __APOLLO_STATE__?: Record<string, { content?: string }> } } }>(f.body);
    const apollo = nd?.props?.pageProps?.__APOLLO_STATE__ ?? {};
    let row: string[] | null = null;
    for (const v of Object.values(apollo)) {
      if (typeof v?.content !== "string" || !v.content.includes("HGX B300")) continue;
      try {
        const page = JSON.parse(v.content) as { blocks?: { type?: string; table?: { content?: string[][] } }[] };
        for (const b of page.blocks ?? []) {
          const t = b.table?.content;
          if (!t) continue;
          const hit = t.find((r) => r[0] === "NVIDIA HGX B300");
          if (hit) { row = hit; break; }
        }
      } catch { /* try next */ }
      if (row) break;
    }
    if (!row) {
      // Fallback: the rendered cells. Five <p>s after the label.
      const m = f.body.match(/NVIDIA HGX B300<\/p>(?:\s*<p[^>]*>([^<]*)<\/p>){4}/);
      if (!m) throw new Error("HGX B300 row not found in Apollo state or HTML");
    }
    const onDemand = row ? money(row[4]) : null;
    const preempt = row ? money(row[3]) : null;
    if (onDemand == null) throw new Error("HGX B300 on-demand cell not numeric");
    const out = [obs({ source: this.meta, provider: "nebius", variant: "HGX B300", term: "on-demand", usdPerGpuHour: onDemand, evidence: evidence(f, "NVIDIA HGX B300") })];
    if (preempt != null) out.push(obs({ source: this.meta, provider: "nebius", variant: "Preemptible", term: "spot", usdPerGpuHour: preempt, evidence: evidence(f, "NVIDIA HGX B300") }));
    return out;
  },
};

// --- Hyperstack ---------------------------------------------------------------

export const hyperstack: Source = {
  meta: SOURCE_META.hyperstack,
  async fetch() {
    const f = await fetchText("https://www.hyperstack.cloud/gpu-pricing");
    const i = f.body.indexOf("NVIDIA B300</span>");
    if (i < 0) throw new Error("'NVIDIA B300' row label not found");
    const window = f.body.slice(i, i + 1600);
    const cells = [...window.matchAll(/<span[^>]*>\s*\$?([\d.]+)\s*<\/span>/g)].map((m) => m[1]);
    // columns after the label: VRAM | pCPUs | RAM | price
    const price = cells.length >= 4 ? money(cells[3]) : null;
    if (price == null || price < 1 || price > 100) throw new Error(`price cell not plausible: ${cells.join(",")}`);
    return [obs({ source: this.meta, provider: "hyperstack", term: "on-demand", usdPerGpuHour: price, evidence: evidence(f, "NVIDIA B300</span>") })];
  },
};

// --- Modal --------------------------------------------------------------------

export const modal: Source = {
  meta: SOURCE_META.modal,
  async fetch() {
    const f = await fetchText("https://modal.com/pricing");
    const m = f.body.match(/Nvidia B300<\/p>[\s\S]{0,400}?<p class="price[^"]*">\s*\$([\d.]+)/);
    if (!m) throw new Error("'Nvidia B300' price block not found");
    const perSec = money(m[1]);
    if (perSec == null) throw new Error("per-second figure not numeric");
    return [obs({ source: this.meta, provider: "modal", term: "on-demand", usdPerGpuHour: round(perSec * 3600), evidence: evidence(f, "Nvidia B300</p>", `$${m[1]}/sec × 3,600`) })];
  },
};

// --- AWS ----------------------------------------------------------------------

const AWS_REGION = "US West (Oregon)";
const AWS_ON_DEMAND = `https://b0.p.awsstatic.com/pricing/2.0/meteredUnitMaps/ec2/USD/current/ec2-ondemand-without-sec-sel/${encodeURIComponent(AWS_REGION)}/Linux/index.json`;

interface AwsMap { regions?: Record<string, Record<string, { price: string; "Instance Type"?: string }>> }

export const aws: Source = {
  meta: SOURCE_META.aws,
  async fetch() {
    const out: Observation[] = [];
    const f = await fetchJson<AwsMap>(AWS_ON_DEMAND);
    const region = f.json.regions?.[AWS_REGION] ?? {};
    const key = Object.keys(region).find((k) => k.startsWith("p6-b300 48xlarge"));
    if (!key) throw new Error("p6-b300.48xlarge not in Oregon map");
    const perInstance = money(region[key].price);
    if (perInstance == null) throw new Error("instance price not numeric");
    out.push(obs({
      source: this.meta, provider: "aws", variant: "p6-b300.48xlarge, on-demand", term: "on-demand",
      usdPerGpuHour: round(perInstance / 8), gpusPerUnit: 8, region: "us-west-2",
      evidence: evidence(f, key, `$${perInstance} per instance-hour ÷ 8 GPUs`),
    }));
    // Capacity Blocks — reserve-ahead, priced lower. Best effort; on-demand already succeeded.
    try {
      const cb = await fetchText("https://aws.amazon.com/ec2/capacityblocks/pricing/");
      // The table is an escaped JSON string inside the page; unescape, then anchor on the GPU cell.
      const plain = cb.body.replace(/\\u003c/g, "<").replace(/\\u003e/g, ">").replace(/\\"/g, '"').replace(/<[^>]+>/g, "");
      const m = plain.match(/US West \(Oregon\)[^$]{0,80}\$([\d.]+) USD \(\$([\d.]+) USD\)[^8]{0,80}8 x B300/);
      if (m) {
        out.push(obs({
          source: this.meta, provider: "aws", variant: "p6-b300.48xlarge, Capacity Block", term: "reserved",
          usdPerGpuHour: money(m[2]), gpusPerUnit: 8, region: "us-west-2",
          evidence: evidence(cb, "p6-b300.48xlarge", `$${m[1]} per instance-hour ÷ 8 GPUs`),
        }));
      }
    } catch { /* capacity blocks page is secondary */ }
    return out;
  },
};

// --- Oracle -------------------------------------------------------------------

interface OciResp { items?: { partNumber: string; displayName: string; metricName: string; currencyCodeLocalizations?: { currencyCode: string; prices?: { model: string; value: number }[] }[] }[] }

export const oracle: Source = {
  meta: SOURCE_META.oracle,
  async fetch() {
    const f = await fetchJson<OciResp>("https://apexapps.oracle.com/pls/apex/cetools/api/v1/products/?partNumber=B112237&currencyCode=USD");
    const item = f.json.items?.[0];
    if (!item) throw new Error("part B112237 not returned");
    if (!/GPU Per Hour/i.test(item.metricName)) throw new Error(`unexpected metric: ${item.metricName}`);
    const usd = item.currencyCodeLocalizations?.find((c) => c.currencyCode === "USD")?.prices?.find((p) => p.model === "PAY_AS_YOU_GO")?.value;
    if (usd == null) throw new Error("PAY_AS_YOU_GO USD price missing");
    return [obs({ source: this.meta, provider: "oracle", variant: "BM.GPU.B300.8", term: "on-demand", usdPerGpuHour: usd, evidence: evidence(f, '"metricName"') })];
  },
};

// --- CoreWeave (gated on-demand, published spot) ------------------------------

export const coreweave: Source = {
  meta: SOURCE_META.coreweave,
  async fetch() {
    const f = await fetchText("https://www.coreweave.com/pricing");
    const i = f.body.indexOf('data-product="nvidia-b300"');
    if (i < 0) throw new Error("nvidia-b300 row not found");
    const row = f.body.slice(i, i + 6000);
    const gated = /Contact sales/i.test(row);
    const spot = row.match(/spot-price[\s\S]{0,300}?\$([\d.]+)/);
    const out: Observation[] = [
      obs({ source: this.meta, provider: "coreweave", variant: "HGX B300", term: "on-demand", usdPerGpuHour: null, fetchability: gated ? "gated" : "error", evidence: evidence(f, 'data-product="nvidia-b300"', gated ? "on-demand price is 'Contact sales'" : undefined) }),
    ];
    const spotUsd = spot ? money(spot[1]) : null;
    if (spotUsd != null) out.push(obs({ source: this.meta, provider: "coreweave", variant: "HGX B300 spot, NA", term: "spot", usdPerGpuHour: round(spotUsd / 8), gpusPerUnit: 8, evidence: evidence(f, "spot-price", `$${spotUsd} per 8-GPU instance ÷ 8`) }));
    return out;
  },
};

// --- Together AI (fully gated) -----------------------------------------------

export const together: Source = {
  meta: SOURCE_META.together,
  async fetch() {
    const f = await fetchText("https://www.together.ai/gpu-clusters");
    if (!/HGX B300/.test(f.body)) throw new Error("HGX B300 no longer on the page");
    const gated = /HGX B300<\/[^>]+>(?:(?!\$)[\s\S]){0,400}?Contact/i.test(f.body);
    const priced = f.body.match(/HGX B300<\/[^>]+>[\s\S]{0,400}?\$([\d.]+)/);
    const usd = !gated && priced ? money(priced[1]) : null;
    return [obs({ source: this.meta, provider: "together", variant: "HGX B300", term: "on-demand", usdPerGpuHour: usd, fetchability: usd == null ? "gated" : "ok", evidence: evidence(f, "HGX B300", usd == null ? "row reads 'Contact us'" : undefined) })];
  },
};

// --- Lambda (does not list B300) ----------------------------------------------

export const lambda: Source = {
  meta: SOURCE_META.lambda,
  async fetch() {
    const f = await fetchText("https://lambda.ai/pricing");
    const hasB300 = /B300/.test(f.body);
    const out: Observation[] = [
      obs({ source: this.meta, provider: "lambda", variant: "HGX B300", term: "on-demand", usdPerGpuHour: null, fetchability: hasB300 ? "gated" : "not-offered", evidence: evidence(f, hasB300 ? "B300" : "HGX B200", hasB300 ? "listed without a price" : "B300 not on the price list") }),
    ];
    const m = f.body.match(/data-plan="NVIDIA HGX B200"[\s\S]{0,1200}?data-label="GPU COUNT">\s*16\s*<[\s\S]{0,300}?data-label="PRICE\/GPU\/HR\*?">\s*\$([\d.]+)/);
    const usd = m ? money(m[1]) : null;
    if (usd != null) out.push(obs({ source: this.meta, provider: "lambda", variant: "HGX B200 1-Click Cluster, 16 GPUs (context)", term: "reserved", usdPerGpuHour: usd, gpusPerUnit: 16, evidence: evidence(f, 'data-plan="NVIDIA HGX B200"') }));
    return out;
  },
};

export const PROVIDER_SOURCES: Source[] = [runpod, vast, nebius, hyperstack, modal, aws, oracle, coreweave, together, lambda];

// ldJson is used by trackers; re-exported here so both files share one import surface.
export { ldJson };

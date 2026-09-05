/**
 * MARKET TRACKER — catalog.
 *
 * Pure data, safe for the browser: every source's identity, what we read and
 * under what terms, plus display names for providers. The fetchers import
 * their meta from here; the UI imports the same objects. Nothing in this file
 * touches the network or node built-ins, so the client bundle never pulls in
 * the parsers or `node:crypto`.
 */

import type { SourceMeta } from "./types";

export const SOURCE_META = {
  runpod: {
    kind: "provider",
      id: "runpod",
      label: "RunPod",
      homepage: "https://www.runpod.io/pricing",
      method: "Unauthenticated GraphQL query for the B300 SXM6 GPU type — the same call the RunPod console makes. Secure Cloud and Community Cloud on-demand, plus the stock status field.",
      terms: "robots.txt allows /; api.runpod.io publishes no robots. Undocumented endpoint.",
  },
  vast: {
    kind: "provider",
      id: "vast",
      label: "Vast.ai",
      homepage: "https://vast.ai/pricing/gpu/B300",
      method: "Public marketplace API, on-demand B300 offers currently rentable. We record the cheapest per-GPU rate, the median, and how many GPUs are listed. This is a marketplace of hosts, so the figure is a floor across sellers, not one seller's rate card.",
      terms: "console.vast.ai robots allows /. We do not use Vast's published pricing JSON, whose licence restricts use in an index.",
  },
  nebius: {
    kind: "provider",
      id: "nebius",
      label: "Nebius",
      homepage: "https://nebius.com/prices",
      method: "The price table embedded in the page's Next.js data. Row 'NVIDIA HGX B300', columns Preemptible and On-demand per GPU-hour.",
      terms: "robots.txt allows / (disallows query strings, which we do not use).",
  },
  hyperstack: {
    kind: "provider",
      id: "hyperstack",
      label: "Hyperstack",
      homepage: "https://www.hyperstack.cloud/gpu-pricing",
      method: "The on-demand pricing table. Row 'NVIDIA B300', last column, per GPU-hour. Hyperstack's stock API requires a key, so no stock signal.",
      terms: "robots.txt allows /.",
  },
  modal: {
    kind: "provider",
      id: "modal",
      label: "Modal",
      homepage: "https://modal.com/pricing",
      method: "Per-second B300 rate on the pricing page, multiplied by 3,600. Modal bills per second; the hourly figure is arithmetic.",
      terms: "robots.txt does not disallow /pricing.",
  },
  aws: {
    kind: "provider",
      id: "aws",
      label: "AWS",
      homepage: "https://aws.amazon.com/ec2/pricing/on-demand/",
      method: "The JSON the EC2 pricing page itself loads for US West (Oregon), Linux, on-demand: p6-b300.48xlarge per instance-hour, divided by its 8 GPUs. Capacity Blocks from the Capacity Blocks pricing page, same division.",
      terms: "Public pricing data; the endpoint is what the console calls. awsstatic publishes no robots.",
  },
  oracle: {
    kind: "provider",
      id: "oracle",
      label: "Oracle Cloud",
      homepage: "https://www.oracle.com/cloud/price-list/",
      method: "Oracle's public price-list API, the one behind its own cost estimator. Part B112237 'Compute - GPU - B300', metric 'GPU Per Hour', pay-as-you-go.",
      terms: "Public API; no robots or terms published for apexapps.oracle.com.",
  },
  coreweave: {
    kind: "provider",
      id: "coreweave",
      label: "CoreWeave",
      homepage: "https://www.coreweave.com/pricing",
      method: "The HGX B300 row of the pricing table. On-demand is 'Contact sales' — recorded as gated. Spot is published per 8-GPU instance and divided by 8.",
      terms: "robots.txt allows /pricing.",
  },
  together: {
    kind: "provider",
      id: "together",
      label: "Together AI",
      homepage: "https://www.together.ai/gpu-clusters",
      method: "Checks that the HGX B300 row still reads 'Contact us'. If a number ever appears we record it; until then the row is gated.",
      terms: "robots.txt allows /.",
  },
  lambda: {
    kind: "provider",
      id: "lambda",
      label: "Lambda",
      homepage: "https://lambda.ai/pricing",
      method: "Confirms B300 is absent from the pricing page. Records the 16-GPU 1-Click Cluster rate for the nearest part (HGX B200) as context — the industry's smallest cluster unit is exactly our fleet size.",
      terms: "robots.txt allows /pricing.",
  },
  getdeploying: {
    kind: "tracker",
      id: "getdeploying",
      label: "GetDeploying",
      homepage: "https://getdeploying.com/gpus/nvidia-b300",
      method: "The public B300 page. Per-provider rows carry the per-GPU price and an availability code as data attributes; the page header carries 'N of M configs in stock'. We read on-demand rows only.",
      terms: "robots.txt allows the page and disallows /api/, which we do not call. Their API terms forbid redistribution of API data; we read the public page and attribute every figure.",
  },
  computeunion: {
    kind: "tracker",
      id: "computeunion",
      label: "ComputeUnion",
      homepage: "https://www.computeunion.net/gpu/gpu-nvidia-b300",
      method: "Their public JSON endpoint, which their robots.txt advertises for automated agents. B300 data is split across two slugs; both are read. Their 'availability' is a scraper heuristic, not provider stock, and is shown as such.",
      terms: "robots.txt allows / and lists /api endpoints as intended for agents.",
  },
  gpufinder: {
    kind: "tracker",
      id: "gpufinder",
      label: "GPU Finder",
      homepage: "https://gpufinder.dev/gpu/b300",
      method: "The public page's structured data: the AggregateOffer low/high/count and the FAQ sentence naming the cheapest confirmed-in-stock rate. We do not call their /api/v1, which their robots.txt reserves for one named crawler.",
      terms: "robots.txt allows the page; disallows /api/ for general agents.",
  },
  gpusio: {
    kind: "tracker",
      id: "gpus-io",
      label: "gpus.io",
      homepage: "https://gpus.io/en/gpus/b300",
      method: "Not read. The site sits behind a JavaScript challenge that blocks automated clients. Their data is reachable through a WAF gap on a 404 route; we do not use it.",
      declined: { reason: "Bot challenge blocks automated reads. We will not route around it." },
  },
  gpucost: {
    kind: "tracker",
      id: "gpucost",
      label: "gpucost.org",
      homepage: "https://gpucost.org/gpu/b300",
      method: "Not read. Their terms of service prohibit automated collection without permission.",
      declined: { reason: "Terms of service forbid automated collection." },
  },
} as const satisfies Record<string, SourceMeta>;

/** Every source in display order: providers first-hand, then trackers, then the refusals. */
export const SOURCE_ORDER = Object.keys(SOURCE_META) as (keyof typeof SOURCE_META)[];

/** Display names for every provider id, including ones we only see via trackers. */
export const PROVIDER_LABEL: Record<string, string> = {
  runpod: "RunPod", vast: "Vast.ai", nebius: "Nebius", hyperstack: "Hyperstack", modal: "Modal", aws: "AWS", oracle: "Oracle Cloud",
  coreweave: "CoreWeave", together: "Together AI", lambda: "Lambda", "gpu-ai": "GPU.ai", spheron: "Spheron", bentaus: "Bentaus", gcore: "Gcore",
  lyceum: "Lyceum", verda: "Verda", "massed-compute": "Massed Compute", scaleway: "Scaleway", latitude: "Latitude.sh", enverge: "Enverge",
  fal: "fal.ai", "prime-intellect": "Prime Intellect", datacrunch: "DataCrunch", lium: "Lium", sesterce: "Sesterce", "theai-cloud": "TheAI Cloud",
  "impossible-cloud": "Impossible Cloud", other: "Other",
};

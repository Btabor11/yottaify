/**
 * VERIFIED HARDWARE PAYLOAD — NVIDIA B300 ("Blackwell Ultra").
 *
 * Specifications as verified against primary sources on 2 Sep 2026.
 * DO NOT round, estimate, extrapolate, or add a figure that is not here.
 * `approx: true` means the tilde renders — the figure is approximate at source
 * and must not be presented as exact.
 */

import { GPUS_PER_NODE } from "./operator";

export interface Spec {
  id: string;
  /** Short label for dense tables. */
  label: string;
  /** Longer label for spacious layouts. */
  longLabel: string;
  /** The number, pre-formatted. Never reformat this in a component. */
  value: string;
  unit: string;
  /** Renders a leading "~". */
  approx: boolean;
  /** One sentence on why a buyer cares. No benchmark claims. */
  why: string;
  sourceId: string;
}

export const GPU = {
  vendor: "NVIDIA",
  model: "B300",
  architectureName: "Blackwell Ultra",
  fullName: "NVIDIA B300",
} as const;

export const SPECS: Spec[] = [
  {
    id: "hbm",
    label: "HBM3e",
    longLabel: "HBM3e memory per GPU",
    value: "288",
    unit: "GB",
    approx: false,
    why: "Sets the ceiling on how much model, KV cache, and activation state fits on a single device before you have to shard.",
    sourceId: "nvidiaBlackwellUltra",
  },
  {
    id: "bandwidth",
    label: "Bandwidth",
    longLabel: "Memory bandwidth",
    value: "8",
    unit: "TB/s",
    approx: true,
    why: "Decode is memory-bound. Bandwidth, not FLOPS, is what governs tokens per second once weights are resident.",
    sourceId: "nvidiaBlackwellUltra",
  },
  {
    id: "fp4",
    label: "Dense FP4",
    longLabel: "Dense NVFP4 compute",
    value: "14–15",
    unit: "PFLOPS",
    approx: true,
    why: "The format the architecture is built around. Prefill and training throughput both scale with it.",
    sourceId: "nvidiaBlackwellUltra",
  },
  {
    id: "nvlink",
    label: "NVLink 5",
    longLabel: "NVLink bandwidth per GPU",
    value: "1.8",
    unit: "TB/s",
    approx: true,
    why: "Bidirectional, across 18 links. This is the number that decides whether tensor parallelism costs you anything.",
    sourceId: "nvidiaBlackwellUltra",
  },
  {
    id: "tdp",
    label: "TDP",
    longLabel: "Configurable TDP",
    value: "1,000–1,400",
    unit: "W",
    approx: true,
    why: "Configurable. We hold headroom at the top of the range rather than running the fleet at its limit.",
    sourceId: "facility",
  },
  {
    id: "sms",
    label: "SMs",
    longLabel: "Streaming multiprocessors",
    value: "160",
    unit: "",
    approx: true,
    why: "Occupancy budget for custom kernels, if you write them.",
    sourceId: "nvidiaBlackwellUltra",
  },
];

/** NVLink topology detail, stated separately because it is a shape not a scalar. */
export const NVLINK = {
  generation: "NVLink 5",
  links: 18,
  perGpuBidirectional: "1.8 TB/s",
  sourceId: "nvidiaBlackwellUltra",
} as const;

/**
 * THE ARGUMENT.
 *
 * Derived, and explicitly cleared for use: 8 × 288 GB = 2,304 GB.
 * Computed rather than hardcoded so it can never drift from the spec above.
 */
const HBM_PER_GPU_GB = 288;

/** Per-GPU memory, pre-formatted. Used anywhere a single device is listed. */
export const HBM_PER_GPU = {
  gb: HBM_PER_GPU_GB,
  display: `${HBM_PER_GPU_GB} GB`,
} as const;

export const NODE = {
  gpus: GPUS_PER_NODE,
  hbmGb: HBM_PER_GPU_GB * GPUS_PER_NODE, // 2304
  get hbmGbFormatted() {
    return this.hbmGb.toLocaleString("en-US");
  },
  /**
   * 2,304 GB → "2.3 TB". Decimal TB (÷1000), which is how the figure is
   * expressed in the verified payload and how memory capacity is quoted in
   * this market. Binary TiB would read 2.25 and would not match the source.
   */
  get hbmTbFormatted() {
    return (Math.round((this.hbmGb / 1000) * 10) / 10).toFixed(1);
  },
  domain: "one coherent NVLink domain",
} as const;

/** The single best sentence on the site. Assembled from verified parts. */
export const HEADLINE_ARGUMENT = {
  figure: `${NODE.hbmGbFormatted} GB`,
  figureAlt: `${NODE.hbmTbFormatted} TB`,
  statement: `An 8-GPU node holds ${NODE.hbmGbFormatted} GB of HBM3e in ${NODE.domain}.`,
  consequence:
    "A model that needs tensor parallelism across several nodes today collapses onto one box. No cross-node collective in the critical path, no fabric to tune, no partition to reason about.",
  sourceId: "nvidiaBlackwellUltra",
} as const;

/**
 * WORKLOAD FIT.
 * The four positions we are allowed to take. No benchmark results — we have
 * not run any, and saying so is part of the pitch.
 */
export interface Workload {
  id: string;
  title: string;
  /** What the hardware property is that makes this fit. */
  because: string;
  /** The spec ids this claim rests on. */
  restsOn: string[];
}

export const WORKLOADS: Workload[] = [
  {
    id: "serving",
    title: "Large-model serving",
    because:
      "288 GB per device means weights, KV cache, and headroom coexist without paging. Batch until the memory runs out rather than until the shard boundary does.",
    restsOn: ["hbm", "bandwidth"],
  },
  {
    id: "long-context",
    title: "Long-context inference",
    because:
      "KV cache is the whole problem at long sequence lengths, and it is a memory problem. Capacity per device is the lever, and bandwidth is what keeps decode moving once the cache is large.",
    restsOn: ["hbm", "bandwidth"],
  },
  {
    id: "nvfp4",
    title: "NVFP4 training",
    because:
      "The architecture is built around dense FP4 at roughly 14–15 PFLOPS per GPU. If your stack already speaks NVFP4, this is the format it was designed for.",
    restsOn: ["fp4"],
  },
  {
    id: "consolidation",
    title: "Tensor-parallel consolidation",
    because:
      `Eight GPUs, ${NODE.hbmGbFormatted} GB, ${NODE.domain} at roughly 1.8 TB/s per GPU across 18 NVLink 5 links. Multi-node tensor parallelism becomes intra-node.`,
    restsOn: ["nvlink", "hbm"],
  },
];

/** Stated plainly, because a technical buyer will ask and the answer is a feature. */
export const NO_BENCHMARKS = {
  heading: "We have not published benchmarks",
  body:
    "The fleet is not online yet, so we have not run any. Every figure above is NVIDIA's published specification for the part, not a measurement of ours. When we have numbers from our own hardware, we will publish the methodology alongside them.",
} as const;

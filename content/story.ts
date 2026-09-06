/**
 * THE STORY.
 *
 * The landing page walks the current from the utility service to the die.
 * Each chapter is one stop on that path, and every figure in it is a payload
 * figure from the modules below — nothing here is authored that is not
 * already verified elsewhere in `content/`.
 *
 * `shape` names the point cloud the stage forms for the chapter. The shapes
 * are generated procedurally in `components/d3/story/shapes.ts`; the names
 * are the contract between the copy and the scene.
 */

import { SITE } from "@/config/site";
import { FACILITY, FLEET, ACCESS, OWNERSHIP, SUPPORT } from "./operator";
import { NODE, HBM_PER_GPU, NVLINK, SPECS, HEADLINE_ARGUMENT, GPU } from "./hardware";
import { PRICE_POSITION, AVAILABILITY_CLAIM, QUOTE } from "./pricing";
import { formatAsOf } from "./copy";

/**
 * `device` is the module itself, sampled from the last frame of the hero's
 * sequence — the field ignites on its silhouette before the story begins.
 */
export type StoryShape = "device" | "horizon" | "terrain" | "meter" | "bus" | "node" | "die" | "days";

export interface StoryReadout {
  k: string;
  v: string;
  /** True for the figure the chapter is about. Drives emphasis, not ranking. */
  lead?: boolean;
}

export interface StoryChapter {
  id: string;
  /** Two-digit chapter mark. */
  index: string;
  shape: StoryShape;
  /** Small label above the heading: where on the path we are. */
  eyebrow: string;
  /** Stencilled display heading. Uppercase at render. */
  heading: string;
  /** Optional italic clause set after the heading in the voice face. */
  voice?: string;
  body: string;
  readout: StoryReadout[];
  sourceId: string;
}

const spec = (id: string) => {
  const s = SPECS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown spec: ${id}`);
  return `${s.approx ? "~" : ""}${s.value} ${s.unit}`;
};

export const STORY: StoryChapter[] = [
  {
    id: "service",
    index: "01",
    shape: "terrain",
    eyebrow: "The site",
    heading: "A building we own,",
    voice: "with nobody else in it.",
    body: `${FACILITY.kind} in the ${SITE.location.region}, ${FACILITY.ownership.toLowerCase()}. ${FACILITY.notColo} — no shared floor, no neighbouring tenant's contractors walking past your node, and no facilities company standing between us and the machines. ${OWNERSHIP.short}, on American soil.`,
    readout: [
      { k: "Region", v: SITE.location.region, lead: true },
      { k: "Building", v: FACILITY.ownership },
      { k: "Tenancy", v: "Single tenant" },
    ],
    sourceId: FACILITY.sourceId,
  },
  {
    id: "meter",
    index: "02",
    shape: "meter",
    eyebrow: "On the other end",
    heading: "Someone is on site,",
    voice: "at three in the morning.",
    body: SUPPORT.body,
    readout: [
      { k: "Support", v: SUPPORT.short, lead: true },
      { k: "Call", v: "An owner answers" },
      { k: "Hands", v: "On the hardware" },
    ],
    sourceId: SUPPORT.sourceId,
  },
  {
    id: "bus",
    index: "03",
    shape: "bus",
    eyebrow: "The fleet",
    heading: `${FLEET.nodesWord.charAt(0).toUpperCase() + FLEET.nodesWord.slice(1)} nodes, one fleet,`,
    voice: `${FLEET.totalWord} devices.`,
    body: `${FLEET.shape} ${ACCESS.headline} No control plane between you and the device, no orchestration layer to learn. Root on the box, the driver stack, and a queue.`,
    readout: [
      { k: "Fleet", v: `${FLEET.total} × ${GPU.model}`, lead: true },
      { k: "Nodes", v: `${FLEET.nodes} × ${FLEET.gpusPerNode}-GPU` },
      { k: "Access", v: ACCESS.model },
    ],
    sourceId: FLEET.sourceId,
  },
  {
    id: "node",
    index: "04",
    shape: "node",
    eyebrow: "One node",
    heading: `${NODE.hbmGbFormatted} GB of HBM3e,`,
    voice: "one coherent domain.",
    body: `${HEADLINE_ARGUMENT.statement} ${HEADLINE_ARGUMENT.consequence}`,
    readout: [
      { k: "Per node", v: `${NODE.hbmGbFormatted} GB`, lead: true },
      { k: "Fabric", v: `${NVLINK.generation}, ${NVLINK.links} links` },
      { k: "Per GPU", v: spec("nvlink") },
    ],
    sourceId: HEADLINE_ARGUMENT.sourceId,
  },
  {
    id: "die",
    index: "05",
    shape: "die",
    eyebrow: "One device",
    heading: `${HBM_PER_GPU.display} on every device,`,
    voice: `${spec("bandwidth")} to move it.`,
    body: `${SPECS.find((s) => s.id === "hbm")?.why} ${SPECS.find((s) => s.id === "bandwidth")?.why}`,
    readout: [
      { k: "HBM3e", v: HBM_PER_GPU.display, lead: true },
      { k: "Bandwidth", v: spec("bandwidth") },
      { k: "Dense FP4", v: spec("fp4") },
    ],
    sourceId: "nvidiaBlackwellUltra",
  },
  {
    id: "days",
    index: "06",
    shape: "days",
    eyebrow: "Time to capacity",
    heading: "Nothing to procure.",
    voice: `${PRICE_POSITION.leadClaim.ours}, not months.`,
    body: AVAILABILITY_CLAIM.support,
    readout: [
      { k: PRICE_POSITION.leadClaim.oursLabel, v: PRICE_POSITION.leadClaim.ours, lead: true },
      { k: PRICE_POSITION.leadClaim.theirsLabel, v: PRICE_POSITION.leadClaim.theirs },
      { k: "Rate", v: QUOTE.short },
    ],
    sourceId: "facility",
  },
];

/** The hero is chapter zero: the horizon before the current is followed. */
export const STORY_OPENING = {
  shape: "horizon" as StoryShape,
  /** The clause set in the voice face inside the stencilled headline. */
  voiceLineIndex: 1,
  /** Label on the stage's title block. */
  stageLabel: "Fig. 00 — the whole of it, building to die",
  /** Read by the chapter rail and the nav. */
  chapterWord: "Chapter",
  /** Labels on the stage index: the figure number and the phase readout. */
  figureWord: "Fig.",
  phaseWord: "Phase",
  /** Label for the point-count readout on the stage. */
  pointsWord: "pts",
} as const;

/** The card that closes the story and opens the paperwork. */
export const STORY_CLOSE = {
  eyebrow: "The lights come on",
  heading: "Now the paperwork.",
  body: `Everything above is a specification. Everything below is a source, a date and a caveat. Checked against published figures, and stated so that it can be argued with.`,
  /** Runs along the top edge of the paper, repeated. */
  ticker: `Checked ${formatAsOf(SITE.pricingAsOf)} · every figure carries its source · ${FLEET.total} × ${GPU.model} · ${QUOTE.label.toLowerCase()} · online ${SITE.availability}`,
} as const;

/** Count of chapters including the opening, for the stage's progress readout. */
export const STORY_LENGTH = STORY.length + 1;

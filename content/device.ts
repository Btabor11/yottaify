/**
 * THE DEVICE VIEW — the opening of the hero.
 *
 * An exploded engineering view of one B300 module, assembled by the scroll,
 * then dissolved into the particle field the rest of the story is drawn with.
 *
 * The frames are photoreal renders generated for this site, not vendor
 * photography, and the copy says so: part labels are descriptive, and every
 * figure on a label rests on a spec in `hardware.ts` and carries its source.
 * Anything not sourced there is a name for a part in the drawing, nothing more.
 */

import { SITE } from "@/config/site";
import { GPU, HBM_PER_GPU, NVLINK, SPECS } from "./hardware";
import { ACCESS, FLEET } from "./operator";

/** A display title, one word a line, so a lighter weight can never re-wrap it. */
const lines = (s: string) => s.split(" ");
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface DeviceCallout {
  id: string;
  /** Part name, set as a mono tag. */
  label: string;
  /** The one thing worth saying about it. Figures come from SPECS. */
  detail: string;
  /** Where the leader line lands on the exploded frame, as fractions of its box. */
  anchor: [number, number];
  /** Which margin the label sits in on wide screens. */
  side: "left" | "right";
  /** Present when the detail carries a figure. */
  sourceId?: string;
}

const spec = (id: string) => {
  const s = SPECS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown spec: ${id}`);
  return `${s.approx ? "~" : ""}${s.value} ${s.unit}`;
};

export const DEVICE_VIEW = {
  /** Above the title. */
  eyebrow: `${GPU.fullName} — exploded view`,
  /**
   * The two title beats, in the words the B300 rental market actually uses.
   * The first is the resting state and the only one a reader without the
   * sequence sees: the architecture name every provider headlines the part
   * by. The second lands once the module has closed and lit, and says the one
   * commercial thing that is true today — reservations are open. Set as lines,
   * because the weight travels and a lighter cut may not re-wrap.
   */
  titleApart: lines(`${GPU.architectureName}.`),
  titleLoad: lines("Now reserving."),
  /** Under the title while the module is open: the fleet, the access model, the date. */
  lede: `${cap(FLEET.totalWord)} of them, on ${ACCESS.model.toLowerCase()}. Online ${SITE.availability}.`,
  /** The nudge, shown until the reader moves. */
  hint: "Scroll to assemble",
  /** Figure caption. Honest about what the picture is. */
  caption: `Fig. 00 — one ${GPU.model} module, illustrative render. Part names describe the drawing; the figures carry their sources.`,
  /** Alternative text for the still. */
  alt: `Exploded view of an ${GPU.fullName} module: finned heatsink, copper cold plate, the ${GPU.architectureName} package with its HBM3e stacks, the power board and the mounting frame, floating apart in a stack.`,
  altAssembled: `The same ${GPU.fullName} module, fully assembled.`,
  callouts: [
    {
      id: "heatsink",
      label: "Heatsink",
      detail: `${FLEET.cooling}, passive fins`,
      anchor: [0.66, 0.11],
      side: "right",
    },
    {
      id: "coldplate",
      label: "Cold plate",
      detail: "Copper, over the package",
      anchor: [0.31, 0.34],
      side: "left",
    },
    {
      id: "package",
      label: `${GPU.architectureName} package`,
      detail: "Two reticle-limited dies",
      anchor: [0.56, 0.47],
      side: "right",
      sourceId: "nvidiaBlackwellUltra",
    },
    {
      id: "hbm",
      label: "HBM3e",
      detail: `${HBM_PER_GPU.display} per GPU`,
      anchor: [0.35, 0.53],
      side: "left",
      sourceId: "nvidiaBlackwellUltra",
    },
    {
      id: "power",
      label: "Power stages",
      detail: `${spec("tdp")} configurable TDP`,
      anchor: [0.71, 0.61],
      side: "right",
      sourceId: "facility",
    },
    {
      id: "interface",
      label: "Board interface",
      detail: `${NVLINK.generation}, ${NVLINK.links} links, ${spec("nvlink")}`,
      anchor: [0.49, 0.8],
      side: "left",
      sourceId: "nvidiaBlackwellUltra",
    },
  ] as DeviceCallout[],
  /** Label on the legend that replaces the leader lines on narrow screens. */
  legendWord: "Parts",
} as const;

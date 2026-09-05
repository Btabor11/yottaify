import { Big_Shoulders, Instrument_Sans, Instrument_Serif, Martian_Mono } from "next/font/google";

/**
 * "SWITCHYARD" TYPOGRAPHY
 *
 * Big Shoulders is a condensed American industrial face — the letterforms of
 * a stencilled panel in a utility yard — with a nine-stop weight axis. The
 * direction animates *weight*, not position: headlines are set as hairlines
 * and thicken as they take load, which is what current does to a conductor.
 * `--wght` is the only variable the choreography touches.
 *
 * Instrument Serif italic is the human voice. It is used sparingly, for the
 * one clause in a headline that is a promise rather than a fact ("in days"),
 * and for the candour section, where the site speaks in the first person.
 * Setting the hard face and the soft face against each other is the whole
 * typographic idea.
 *
 * Instrument Sans carries running text. Same foundry as the serif, so the
 * italics share a skeleton, and it has a width axis for tight table cells.
 *
 * Martian Mono is the telemetry face: figures, labels, title blocks. Its own
 * width axis lets a narrow setting sit in a 26-character column without a
 * smaller size.
 */

export const bigShoulders = Big_Shoulders({
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
  display: "swap",
  variable: "--d3-display",
});

export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic", "normal"],
  display: "swap",
  variable: "--d3-voice",
});

export const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
  display: "swap",
  variable: "--d3-sans",
});

export const martianMono = Martian_Mono({
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
  display: "swap",
  variable: "--d3-mono",
});

export const d3FontClass = `${bigShoulders.variable} ${instrumentSerif.variable} ${instrumentSans.variable} ${martianMono.variable}`;

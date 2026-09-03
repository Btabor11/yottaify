import { Instrument_Serif, Newsreader, Spline_Sans_Mono } from "next/font/google";

/**
 * D2 "LEDGER" TYPOGRAPHY
 *
 * Instrument Serif is a high-contrast display face with one weight — which is
 * a feature here. It forces size and space to do the emphasis instead of bold,
 * which is how a printed page actually works.
 *
 * Newsreader carries running text, with the optical-size axis wired up so long
 * copy at 17px and pull-quotes at 30px are drawn differently rather than
 * scaled. That difference is most of why this reads as typeset rather than
 * styled.
 *
 * Spline Sans Mono handles figures and the footnote apparatus. Every number in
 * a ruled column has to align, and a mono is the only honest way to do it.
 */

export const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--d2-display",
});

export const newsreader = Newsreader({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  variable: "--d2-serif",
});

export const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--d2-mono",
});

export const d2FontClass = `${instrument.variable} ${newsreader.variable} ${splineMono.variable}`;

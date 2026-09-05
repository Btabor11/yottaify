import { Azeret_Mono, Fraunces } from "next/font/google";

/**
 * Night Board type. Loaded only by admin layouts so the public site never
 * pays for these faces.
 *
 * Fraunces is a soft optical-size serif — the night editor reading the chart.
 * Azeret Mono is the instrument: every figure, label, and table cell.
 */

export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
  variable: "--admin-display",
});

export const azeret = Azeret_Mono({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--admin-mono",
});

export const adminFontClass = `${fraunces.variable} ${azeret.variable}`;

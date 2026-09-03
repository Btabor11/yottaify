import { Archivo, Martian_Mono } from "next/font/google";

/**
 * D1 "COLD ROOM" TYPOGRAPHY
 *
 * Archivo carries a width axis, which is the whole point: headlines run at
 * ~62% width so they can be enormous and still fit, while running text sits at
 * normal width. One family, two very different voices — that reads as
 * engineered rather than assembled.
 *
 * Martian Mono handles every number, label, and channel identifier. It has a
 * deliberately wide, mechanical rhythm that makes a table of figures look like
 * instrument output instead of a spreadsheet.
 */

export const archivo = Archivo({
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
  display: "swap",
  variable: "--d1-sans",
  // Fallback metrics matched to Archivo so the swap does not shift layout.
  adjustFontFallback: true,
});

export const martian = Martian_Mono({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--d1-mono",
});

export const d1FontClass = `${archivo.variable} ${martian.variable}`;

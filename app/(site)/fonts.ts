import { Anybody, Space_Grotesk, JetBrains_Mono } from "next/font/google";

/**
 * D3 "SUBSTATION" TYPOGRAPHY
 *
 * Anybody is a variable grotesque with a real width axis (50–150). D3 animates
 * that axis rather than animating position: headlines widen as they take load,
 * which is the direction's whole thesis expressed in type. A static face could
 * not do it, and faking it with transform: scaleX() would distort the strokes.
 *
 * Space Grotesk carries running text — a neo-grotesque with enough character
 * in the numerals and the `a` to sit under Anybody without looking like a
 * default UI face.
 *
 * JetBrains Mono handles telemetry and figures. Chosen over the other two
 * directions' monos so all three read as different rooms.
 */

export const anybody = Anybody({
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
  display: "swap",
  variable: "--d3-display",
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--d3-sans",
});

export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--d3-mono",
});

export const d3FontClass = `${anybody.variable} ${spaceGrotesk.variable} ${jetbrains.variable}`;

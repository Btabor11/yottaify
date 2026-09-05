import { ImageResponse } from "next/og";
import { SITE } from "@/config/site";
import { HERO } from "@/content";
import { SCENE } from "@/components/d3/palette";

/**
 * Social card. Generated so it follows a rename and a rate change without
 * anyone remembering to re-export a PNG.
 *
 * Composition is the hero's title block on the dark ground: the three-line
 * headline with the voice clause in the live colour, and four facts ruled off
 * beneath it. No fonts are fetched at build time, because `ImageResponse`
 * cannot read `next/font`; the system stack at weight 800 keeps the shape of
 * the display face closely enough for a 1200×630 tile.
 *
 * Colour comes from `SCENE`, the same audited literals the WebGL scenes use.
 */
export const alt = HERO.headline;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const facts = HERO.facts.slice(0, 4);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          background: SCENE.bg,
          color: SCENE.ink,
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
        }}
      >
        {/* Nameplate + status */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `2px solid ${SCENE.hbm}`,
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "-0.03em",
              }}
            >
              {SITE.monogram}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
              {SITE.name}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: SCENE.caution }} />
            {SITE.availability}
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 0.92, letterSpacing: "-0.03em" }}>
          {HERO.headlineLines.map((line, i) => (
            <div
              key={line}
              style={{
                fontSize: 128,
                fontWeight: 800,
                textTransform: i === 1 ? "none" : "uppercase",
                fontStyle: i === 1 ? "italic" : "normal",
                fontFamily: i === 1 ? "Georgia, Times New Roman, serif" : "Helvetica Neue, Helvetica, Arial, sans-serif",
                color: i === 1 ? SCENE.ember : SCENE.ink,
              }}
            >
              {line}
            </div>
          ))}
        </div>

        {/* Title block */}
        <div style={{ display: "flex", borderTop: `1px solid ${SCENE.ink}`, opacity: 0.92 }}>
          {facts.map((f, i) => (
            <div
              key={f.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                paddingTop: 18,
                paddingRight: 20,
                paddingLeft: i === 0 ? 0 : 20,
                borderLeft: i === 0 ? "none" : `1px solid ${SCENE.ink}`,
              }}
            >
              <div style={{ fontSize: 15, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.7 }}>{f.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.01em" }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}

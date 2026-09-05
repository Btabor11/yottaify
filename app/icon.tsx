import { ImageResponse } from "next/og";
import { SITE } from "@/config/site";
import { SCENE } from "@/components/d3/palette";

/**
 * The tab-bar version of the nameplate in `D3Logo`: monogram in a boxed cell.
 *
 * Generated rather than shipped as a file so it follows a rename —
 * `SITE.monogram` derives from `shortName`.
 *
 * `ImageResponse` rasterises outside the document, so CSS custom properties do
 * not resolve here. Colour comes from `SCENE`, the same audited literals the
 * WebGL scenes read, rather than fresh hex.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: SCENE.bg,
          // The nameplate's hairline is --edge, which is too low-contrast to
          // survive 32px. The live cyan holds the tile against any tab colour.
          border: `2px solid ${SCENE.hbm}`,
          color: SCENE.ink,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: "-0.03em",
        }}
      >
        {SITE.monogram}
      </div>
    ),
    size,
  );
}

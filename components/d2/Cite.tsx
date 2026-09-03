import { source } from "@/content";
import { footnoteNumber } from "./apparatus";

/**
 * A footnote marker. Renders a superscript numeral that links to the source
 * apparatus, with the source's own description as the accessible name — so a
 * screen reader hears "source: Oracle Cloud price list, read 2 September 2026"
 * rather than "superscript five".
 */
export function Cite({ sourceId }: { sourceId: string }) {
  const n = footnoteNumber(sourceId);
  const src = source(sourceId);
  return (
    <a
      href={`#fn-${n}`}
      className="d2-fn"
      aria-label={`Footnote ${n}: ${src.label}`}
      title={src.label}
    >
      {n}
    </a>
  );
}

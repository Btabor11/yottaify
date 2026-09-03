import { FLEET, NODE } from "@/content";

/**
 * The fleet, drawn to scale: sixteen cells in two groups of eight.
 *
 * This is the site's signature mark. It works because the number is small and
 * honest — a competitor with "100+ GPUs" could not draw this, and a visitor
 * can count it. The whole strip is one flex row of divs; no canvas, no JS.
 */
export function FleetStrip() {
  const nodes = Array.from({ length: FLEET.nodes }, (_, n) =>
    Array.from({ length: FLEET.gpusPerNode }, (_, g) => n * FLEET.gpusPerNode + g + 1),
  );

  return (
    <figure>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <figcaption className="d1-label text-[var(--ink-3)]">
          The fleet — {FLEET.total} units, drawn to count
        </figcaption>
        <span className="d1-label text-[var(--ink-3)]">Schematic, not to scale</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        {nodes.map((units, n) => (
          <div key={n} className="d1-ticked relative border border-[var(--rule-strong)] p-3">
            {/* Travelling highlight. Purely decorative — it encodes nothing,
                and it is removed entirely under reduced motion. */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div
                className="d1-sweep h-full w-1/3"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, color-mix(in oklab, var(--accent) 14%, transparent), transparent)",
                  animationDelay: `${n * 1.4}s`,
                }}
              />
            </div>

            <div className="relative flex items-baseline justify-between gap-3">
              <span className="d1-label text-[var(--ink-2)]">
                Node {String(n + 1).padStart(2, "0")}
              </span>
              <span className="d1-figure text-[0.625rem] tracking-[0.04em] text-[var(--ink-3)]">
                {FLEET.gpusPerNode} × B300 · {NODE.hbmGbFormatted} GB
              </span>
            </div>

            <div className="relative mt-3 flex gap-1.5">
              {units.map((u) => (
                <div key={u} className="group flex-1">
                  <div
                    className="h-11 border transition-colors duration-500 sm:h-14"
                    style={{
                      borderColor: "var(--rule-strong)",
                      background:
                        "linear-gradient(to top, color-mix(in oklab, var(--accent) 9%, transparent), transparent)",
                    }}
                  >
                    {/* Die-shaped inner rectangle — a GPU package, abstracted. */}
                    <div
                      className="mx-auto mt-2 h-4 w-[62%] border border-[var(--rule-strong)] sm:mt-2.5 sm:h-6"
                      style={{ background: "var(--surface-2)" }}
                    />
                  </div>
                  <div className="d1-figure mt-1.5 text-center text-[0.5rem] text-[var(--ink-3)]">
                    {String(u).padStart(2, "0")}
                  </div>
                </div>
              ))}
            </div>

            <div className="relative mt-2 flex items-center gap-2 border-t border-[var(--rule)] pt-2">
              <span className="d1-label text-[var(--ink-3)]">NVLink domain</span>
              <span aria-hidden className="h-px flex-1 bg-[var(--rule-strong)]" />
              <span className="d1-figure text-[0.5625rem] text-[var(--accent)]">
                {NODE.hbmTbFormatted} TB coherent
              </span>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}

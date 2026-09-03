import { row, RATE, formatAsOfShort, source } from "@/content";
import { footnoteNumber } from "./apparatus";

/**
 * The rate scale, drawn as a printed number line with a magnified detail band.
 *
 * Why not bars: every rate between $6.50 and $7.89 sits inside 8% of a bar
 * chart's width, which is exactly where the argument lives. A number line with
 * an inset detail — the device a statistical annual would use — gives that
 * cluster its own scale without misrepresenting the full range that the
 * hyperscalers occupy.
 *
 * The unverified band is drawn, hatched, to the LEFT of our own marker. It is
 * cheaper than us and the chart says so. Every marker carries its footnote
 * number, so the reader can resolve any figure to a source without leaving the
 * chart.
 *
 * Hidden below md: at 375px this becomes unreadable, and the ruled table
 * beneath it already carries every figure.
 */

const W = 1000;
const PAD = 72;
const SPAN = W - PAD * 2;

const MAIN_MAX = 18;
const DETAIL_LO = 6.25;
const DETAIL_HI = 8.0;

const MAIN_AXIS_Y = 104;
const DETAIL_AXIS_Y = 244;

const mainX = (v: number) => PAD + (v / MAIN_MAX) * SPAN;
const detailX = (v: number) => PAD + ((v - DETAIL_LO) / (DETAIL_HI - DETAIL_LO)) * SPAN;

const MONO = "var(--fm)";

function T({
  x,
  y,
  children,
  anchor = "middle",
  fill = "var(--ink)",
  size = 12,
  weight = 500,
  tabular = true,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  anchor?: "start" | "middle" | "end";
  fill?: string;
  size?: number;
  weight?: number;
  tabular?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={fill}
      style={{
        font: `${weight} ${size}px ${MONO}`,
        fontVariantNumeric: tabular ? "tabular-nums" : undefined,
        letterSpacing: tabular ? "-0.01em" : "0.1em",
      }}
    >
      {children}
    </text>
  );
}

/** A labelled marker: stem, dot, figure, name, footnote. */
function Marker({
  x,
  axisY,
  dir,
  figure,
  name,
  fn,
  color,
  emphasis = false,
  stem = 34,
}: {
  x: number;
  axisY: number;
  dir: -1 | 1;
  figure: string;
  name: string;
  fn: number;
  color: string;
  emphasis?: boolean;
  stem?: number;
}) {
  const tipY = axisY + dir * stem;
  const figureY = dir === -1 ? tipY - 5 : tipY + 15;
  const nameY = dir === -1 ? tipY - 19 : tipY + 28;

  return (
    <g>
      <line
        x1={x}
        y1={axisY}
        x2={x}
        y2={tipY}
        stroke={color}
        strokeWidth={emphasis ? 1.6 : 1}
      />
      <circle cx={x} cy={axisY} r={emphasis ? 4 : 2.6} fill={color} />
      <T x={x} y={figureY} fill={color} size={emphasis ? 19 : 14} weight={emphasis ? 600 : 500}>
        {figure}
      </T>
      <T x={x} y={nameY} fill="var(--ink-2)" size={8.5} tabular={false}>
        {`${name.toUpperCase()} `}
        <tspan fill="var(--accent)" dy={-3} style={{ font: `600 7px ${MONO}` }}>
          {fn}
        </tspan>
      </T>
    </g>
  );
}

export function RateScale() {
  const ours = row("ours");
  const unverified = row("neocloud-low");
  const verified = row("verified-low");
  const median = row("median");
  const oracle = row("oracle");
  const aws = row("aws");
  const committed = row("committed");

  return (
    <figure className="hidden md:block">
      <svg
        viewBox={`0 0 ${W} 300`}
        className="h-auto w-full"
        role="img"
        aria-label={`Number line of published B300 rates per GPU-hour. Our rate ${ours.display}. Unverified neocloud listings ${unverified.display}. Lowest verified in stock ${verified.display}. Median across tracked providers ${median.display}. Oracle ${oracle.display}. AWS ${aws.display}. Committed terms across providers ${committed.display}.`}
      >
        <defs>
          <pattern
            id="d2rs-hatch"
            width="6"
            height="6"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--caution)" strokeWidth="1.1" />
          </pattern>
        </defs>

        {/* ---------- MAIN SCALE, 0 to 18 ---------- */}
        <T x={PAD} y={30} anchor="start" fill="var(--ink-3)" size={9} tabular={false}>
          FULL SCALE — USD PER GPU-HOUR
        </T>

        <line
          x1={PAD}
          y1={MAIN_AXIS_Y}
          x2={W - PAD}
          y2={MAIN_AXIS_Y}
          stroke="var(--ink)"
          strokeWidth="1.4"
        />

        {[0, 3, 6, 9, 12, 15, 18].map((t) => (
          <g key={t}>
            <line
              x1={mainX(t)}
              y1={MAIN_AXIS_Y}
              x2={mainX(t)}
              y2={MAIN_AXIS_Y + 7}
              stroke="var(--rule-strong)"
              strokeWidth="1"
            />
            <T x={mainX(t)} y={MAIN_AXIS_Y + 20} fill="var(--ink-3)" size={10}>
              {`$${t}`}
            </T>
          </g>
        ))}

        {/* committed range — a bracket, because it is a market range not a rate */}
        <g>
          <line
            x1={mainX(committed.low)}
            y1={MAIN_AXIS_Y - 16}
            x2={mainX(committed.high!)}
            y2={MAIN_AXIS_Y - 16}
            stroke="var(--accent-2)"
            strokeWidth="1.2"
          />
          {[committed.low, committed.high!].map((v) => (
            <line
              key={v}
              x1={mainX(v)}
              y1={MAIN_AXIS_Y - 21}
              x2={mainX(v)}
              y2={MAIN_AXIS_Y - 11}
              stroke="var(--accent-2)"
              strokeWidth="1.2"
            />
          ))}
          <T
            x={(mainX(committed.low) + mainX(committed.high!)) / 2}
            y={MAIN_AXIS_Y - 27}
            fill="var(--accent-2)"
            size={11}
          >
            {committed.display}
          </T>
          <T
            x={(mainX(committed.low) + mainX(committed.high!)) / 2}
            y={MAIN_AXIS_Y - 40}
            fill="var(--ink-2)"
            size={8.5}
            tabular={false}
          >
            {"COMMITTED, 24–60 MO "}
            <tspan fill="var(--accent)" dy={-3} style={{ font: `600 7px ${MONO}` }}>
              {footnoteNumber(committed.sourceId)}
            </tspan>
          </T>
        </g>

        <Marker
          x={mainX(oracle.low)}
          axisY={MAIN_AXIS_Y}
          dir={-1}
          figure={oracle.display}
          name={oracle.provider}
          fn={footnoteNumber(oracle.sourceId)}
          color="var(--ink)"
          stem={30}
        />
        <Marker
          x={mainX(aws.low)}
          axisY={MAIN_AXIS_Y}
          dir={-1}
          figure={aws.display}
          name={aws.provider}
          fn={footnoteNumber(aws.sourceId)}
          color="var(--ink)"
          stem={62}
        />

        {/* ---------- DETAIL LENS ---------- */}
        <rect
          x={mainX(DETAIL_LO)}
          y={MAIN_AXIS_Y - 6}
          width={mainX(DETAIL_HI) - mainX(DETAIL_LO)}
          height={12}
          fill="var(--surface-2)"
          stroke="var(--ink)"
          strokeWidth="1"
        />
        <path
          d={`M${mainX(DETAIL_LO)},${MAIN_AXIS_Y + 6} L${PAD},${DETAIL_AXIS_Y - 52} L${W - PAD},${DETAIL_AXIS_Y - 52} L${mainX(DETAIL_HI)},${MAIN_AXIS_Y + 6} Z`}
          fill="var(--surface)"
          stroke="var(--rule-strong)"
          strokeWidth="0.8"
          strokeDasharray="3 3"
          opacity="0.85"
        />

        {/* ---------- DETAIL SCALE, 6.25 to 8.00 ---------- */}
        <T x={PAD} y={DETAIL_AXIS_Y - 62} anchor="start" fill="var(--ink-3)" size={9} tabular={false}>
          DETAIL — $6.25 TO $8.00, WHERE THE ARGUMENT IS
        </T>

        <line
          x1={PAD}
          y1={DETAIL_AXIS_Y}
          x2={W - PAD}
          y2={DETAIL_AXIS_Y}
          stroke="var(--ink)"
          strokeWidth="1.4"
        />
        {[6.5, 7.0, 7.5, 8.0].map((t) => (
          <g key={t}>
            <line
              x1={detailX(t)}
              y1={DETAIL_AXIS_Y}
              x2={detailX(t)}
              y2={DETAIL_AXIS_Y + 7}
              stroke="var(--rule-strong)"
              strokeWidth="1"
            />
            <T x={detailX(t)} y={DETAIL_AXIS_Y + 20} fill="var(--ink-3)" size={10}>
              {`$${t.toFixed(2)}`}
            </T>
          </g>
        ))}

        {/* unverified band, hatched, sitting below our own marker's price */}
        <g>
          <rect
            x={detailX(unverified.low)}
            y={DETAIL_AXIS_Y - 34}
            width={detailX(unverified.high!) - detailX(unverified.low)}
            height={17}
            fill="url(#d2rs-hatch)"
            stroke="var(--caution)"
            strokeWidth="1.1"
          />
          <T
            x={(detailX(unverified.low) + detailX(unverified.high!)) / 2}
            y={DETAIL_AXIS_Y - 42}
            fill="var(--caution)"
            size={13}
          >
            {unverified.display}
          </T>
          <T
            x={(detailX(unverified.low) + detailX(unverified.high!)) / 2}
            y={DETAIL_AXIS_Y - 55}
            fill="var(--ink-2)"
            size={8.5}
            tabular={false}
          >
            {"UNVERIFIED LISTINGS "}
            <tspan fill="var(--accent)" dy={-3} style={{ font: `600 7px ${MONO}` }}>
              {footnoteNumber(unverified.sourceId)}
            </tspan>
          </T>
        </g>

        {/* our rate — the emphasised marker, below the axis */}
        <Marker
          x={detailX(ours.low)}
          axisY={DETAIL_AXIS_Y}
          dir={1}
          figure={RATE.display}
          name="Our rate"
          fn={footnoteNumber(ours.sourceId)}
          color="var(--accent)"
          emphasis
          stem={16}
        />

        {/* lowest verified in stock — above */}
        <Marker
          x={detailX(verified.low)}
          axisY={DETAIL_AXIS_Y}
          dir={-1}
          figure={verified.display}
          name="Lowest verified in stock"
          fn={footnoteNumber(verified.sourceId)}
          color="var(--accent-2)"
          emphasis
          stem={20}
        />

        {/* median — below, offset so it clears our marker's label */}
        <Marker
          x={(detailX(median.low) + detailX(median.high!)) / 2}
          axisY={DETAIL_AXIS_Y}
          dir={1}
          figure={median.display}
          name="Median"
          fn={footnoteNumber(median.sourceId)}
          color="var(--ink)"
          stem={16}
        />
      </svg>

      <figcaption className="d2-prose mt-4 max-w-[74ch] text-[0.8125rem] text-[var(--ink-3)] text-pretty">
        Rates as read on {formatAsOfShort(source("ours").accessed)}. The detail scale is magnified;
        the hatched band is a published price we could not confirm as in stock, and it is cheaper
        than ours. Superscripts resolve to sources below.
      </figcaption>
    </figure>
  );
}

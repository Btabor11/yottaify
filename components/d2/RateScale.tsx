import { row, RATE, formatAsOfShort, source } from "@/content";
import { usd } from "@/lib/estimate";
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
 * Layout note: the vertical positions below are laid out by hand into
 * non-overlapping bands rather than computed, because a magnified inset has
 * genuinely fixed zones and an auto-layout would only hide a collision.
 *
 *   26        full-scale caption
 *   44–70     committed range bracket
 *   49–95     hyperscaler markers (above the axis)
 *   130       MAIN AXIS · ticks to 137 · figures at 150
 *   158–192   lens leaders, with the inset caption in the corridor at 180
 *   211–247   unverified band and the verified marker (above the axis)
 *   250       DETAIL AXIS · ticks to 257 · figures at 270
 *   284–312   our rate and the median (below the axis)
 *
 * Hidden below md: at 375px this becomes unreadable, and the ruled table
 * beneath it already carries every figure.
 */

const W = 1000;
const H = 340;
const PAD = 72;
const SPAN = W - PAD * 2;

const MAIN_MAX = 18;
const DETAIL_LO = 6.25;
const DETAIL_HI = 8.0;

const MAIN_AXIS_Y = 130;
const DETAIL_AXIS_Y = 250;
/** Where the lens leaders start and land. Below the main figures, above the inset. */
const LENS_TOP = 158;
const LENS_BOTTOM = 192;

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

/** Uppercase name with its footnote number, as one label. */
function Name({
  x,
  y,
  children,
  fn,
  anchor = "middle",
}: {
  x: number;
  y: number;
  children: string;
  fn: number;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <T x={x} y={y} anchor={anchor} fill="var(--ink-2)" size={8.5} tabular={false}>
      {`${children.toUpperCase()} `}
      <tspan fill="var(--accent)" dy={-3} style={{ font: `600 7px ${MONO}` }}>
        {fn}
      </tspan>
    </T>
  );
}

/** A labelled marker: stem off the axis, dot on it, figure and name beyond. */
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
      <line x1={x} y1={axisY} x2={x} y2={tipY} stroke={color} strokeWidth={emphasis ? 1.6 : 1} />
      <circle cx={x} cy={axisY} r={emphasis ? 4 : 2.6} fill={color} />
      <T x={x} y={figureY} fill={color} size={emphasis ? 19 : 14} weight={emphasis ? 600 : 500}>
        {figure}
      </T>
      <Name x={x} y={nameY} fn={fn}>
        {name}
      </Name>
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

  const committedMid = (mainX(committed.low) + mainX(committed.high!)) / 2;
  const unverifiedMid = (detailX(unverified.low) + detailX(unverified.high!)) / 2;
  const medianMid = (detailX(median.low) + detailX(median.high!)) / 2;

  return (
    <figure className="hidden md:block">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Number line of published B300 rates per GPU-hour. Our rate ${ours.display}. Unverified neocloud listings ${unverified.display}. Lowest verified in stock ${verified.display}. Median across tracked providers ${median.display}. ${oracle.provider} ${oracle.display}. ${aws.provider} ${aws.display}. Committed terms across providers ${committed.display}.`}
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

        {/* ---------- MAIN SCALE, $0 to $18 ---------- */}
        <T x={PAD} y={26} anchor="start" fill="var(--ink-3)" size={9} tabular={false}>
          FULL SCALE — USD PER GPU-HOUR
        </T>

        {/* committed range — a bracket, because it is a market range not a rate */}
        <g>
          <Name x={committedMid} y={44} fn={footnoteNumber(committed.sourceId)}>
            Committed, 24–60 mo
          </Name>
          <T x={committedMid} y={58} fill="var(--accent-2)" size={11}>
            {committed.display}
          </T>
          <line
            x1={mainX(committed.low)}
            y1={70}
            x2={mainX(committed.high!)}
            y2={70}
            stroke="var(--accent-2)"
            strokeWidth="1.2"
          />
          {[committed.low, committed.high!].map((v) => (
            <line
              key={v}
              x1={mainX(v)}
              y1={65}
              x2={mainX(v)}
              y2={75}
              stroke="var(--accent-2)"
              strokeWidth="1.2"
            />
          ))}
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

        {/* ---------- THE LENS ----------
            A marked segment sitting on the axis, and two leaders opening out to
            the inset below. Deliberately unfilled: a filled fan would cover the
            axis figures it is drawn over. */}
        <g>
          <rect
            x={mainX(DETAIL_LO)}
            y={MAIN_AXIS_Y - 5}
            width={mainX(DETAIL_HI) - mainX(DETAIL_LO)}
            height={10}
            fill="var(--accent-2)"
            fillOpacity="0.16"
            stroke="var(--accent-2)"
            strokeWidth="1"
          />
          {[DETAIL_LO, DETAIL_HI].map((v) => (
            <line
              key={v}
              x1={mainX(v)}
              y1={MAIN_AXIS_Y - 9}
              x2={mainX(v)}
              y2={MAIN_AXIS_Y + 9}
              stroke="var(--accent-2)"
              strokeWidth="1"
            />
          ))}
        </g>

        <g stroke="var(--rule-strong)" strokeWidth="0.9" strokeDasharray="4 3">
          <line x1={mainX(DETAIL_LO)} y1={LENS_TOP} x2={PAD} y2={LENS_BOTTOM} />
          <line x1={mainX(DETAIL_HI)} y1={LENS_TOP} x2={W - PAD} y2={LENS_BOTTOM} />
        </g>

        {/* Caption rides in the corridor between the two leaders, on a knocked-out
            patch of stock so the dashes break around it rather than through it. */}
        <rect x={W / 2 - 152} y={172} width={304} height={12} fill="var(--bg)" />
        <T x={W / 2} y={181} fill="var(--ink-3)" size={9} tabular={false}>
          {`DETAIL — ${usd(DETAIL_LO)} TO ${usd(DETAIL_HI)}, WHERE THE ARGUMENT IS`}
        </T>

        {/* ---------- DETAIL SCALE, $6.25 to $8.00 ---------- */}

        {/* unverified band, hatched, sitting to the left of our own marker */}
        <g>
          <Name x={unverifiedMid} y={211} fn={footnoteNumber(unverified.sourceId)}>
            Unverified listings
          </Name>
          <T x={unverifiedMid} y={226} fill="var(--caution)" size={13}>
            {unverified.display}
          </T>
          <rect
            x={detailX(unverified.low)}
            y={230}
            width={detailX(unverified.high!) - detailX(unverified.low)}
            height={17}
            fill="url(#d2rs-hatch)"
            stroke="var(--caution)"
            strokeWidth="1.1"
          />
        </g>

        {/* lowest verified in stock — above the axis, opposite the hatched band */}
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

        {/* our rate — the emphasised marker, below the axis and clear of the figures */}
        <Marker
          x={detailX(ours.low)}
          axisY={DETAIL_AXIS_Y}
          dir={1}
          figure={RATE.display}
          name="Our rate"
          fn={footnoteNumber(ours.sourceId)}
          color="var(--accent)"
          emphasis
          stem={34}
        />

        {/* median — below, on the same baseline as our own label */}
        <Marker
          x={medianMid}
          axisY={DETAIL_AXIS_Y}
          dir={1}
          figure={median.display}
          name="Median"
          fn={footnoteNumber(median.sourceId)}
          color="var(--ink)"
          stem={34}
        />
      </svg>

      <figcaption className="d2-prose mt-4 max-w-[74ch] text-[0.8125rem] text-[var(--ink-3)] text-pretty">
        Rates as read on {formatAsOfShort(source("ours").accessed)}. The lower scale is the boxed
        segment of the upper one, magnified; the hatched band is a published price we could not
        confirm as in stock, and it is cheaper than ours. Superscripts resolve to sources below.
      </figcaption>
    </figure>
  );
}

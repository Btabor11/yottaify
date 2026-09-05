/**
 * One sounding, close up.
 *
 * Two readouts that only make sense on the dossier: where this row sits on
 * the same depth scale the board draws, and what its own behaviour columns
 * observed. Both are deliberately unglamorous — the dossier's job is to be
 * read carefully by someone who is about to write an email.
 */

import { ADMIN, STAGE_DEPTH, STAGE_ORDER } from "@/content";
import { STATUS_LABEL, type ReservationStatus } from "@/lib/server/schema";
import type { ReadKey } from "@/app/admin/derive";
import { depth } from "@/app/admin/format";
import { level } from "./Plate";

/** Observations that read as encouraging, and ones worth a second look. */
const TONE: Partial<Record<ReadKey, "good" | "watch">> = {
  deliberate: "good",
  priced: "good",
  estimated: "good",
  followed: "good",
  returning: "good",
  struggled: "watch",
  quick: "watch",
};

const LABEL: Record<ReadKey, string> = {
  deliberate: ADMIN.read.deliberate,
  quick: ADMIN.read.quick,
  priced: ADMIN.read.priced,
  estimated: ADMIN.read.estimated,
  struggled: ADMIN.read.struggled,
  noJs: ADMIN.read.noJs,
  returning: ADMIN.read.returning,
  followed: ADMIN.read.followed,
};

/**
 * The stage ladder, with the track filled to wherever this row has got to.
 *
 * Terminal rows — declined, withdrawn, spam — are shown against the same
 * ladder with nothing filled, because "it went nowhere" is the fact, and
 * hiding the ladder would make a dead row look like a new one.
 */
export function DepthGauge({ status, spam }: { status: ReservationStatus; spam: boolean }) {
  const key: ReservationStatus = spam ? "spam" : status;
  const here = STAGE_DEPTH[key] ?? 0;
  const live = (STAGE_ORDER as readonly string[]).includes(key);

  return (
    <ol className="adm-gauge" style={level(live ? here : 0)}>
      {STAGE_ORDER.map((s) => {
        const d = STAGE_DEPTH[s] ?? 0;
        return (
          <li
            key={s}
            className="adm-gauge-step"
            data-here={live && s === key ? "true" : undefined}
            data-done={live && d < here ? "true" : undefined}
            aria-current={live && s === key ? "step" : undefined}
          >
            <span>{STATUS_LABEL[s as ReservationStatus]}</span>
            <span className="adm-gauge-depth" aria-hidden>
              {depth(d)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Reading({ keys }: { keys: ReadKey[] }) {
  if (keys.length === 0) return <p className="text-[var(--ink-3)]">{ADMIN.read.none}</p>;
  return (
    <ul className="adm-obs">
      {keys.map((k) => (
        <li key={k} data-tone={TONE[k]}>
          {LABEL[k]}
        </li>
      ))}
    </ul>
  );
}

/**
 * What somebody should pick up next.
 *
 * The one instrument on the board that makes a recommendation, so it shows
 * its working: every row names the reasons it is here and how long it has
 * been waiting, and the ranking is only ever a sort order over those facts.
 * A number that tells you what to do without telling you why is a number
 * people learn to ignore.
 */

import Link from "next/link";
import { ADMIN } from "@/content";
import type { AttentionReason, Waiting } from "@/app/admin/derive";
import { days, gpu } from "@/app/admin/format";
import { HoldBridge } from "./HoldBridge";
import { TierMark } from "./Marks";

const REASON: Record<AttentionReason, string> = {
  unowned: ADMIN.attention.reasonUnowned,
  stalled: ADMIN.attention.reasonStalled,
  new: ADMIN.attention.reasonNew,
  followup: ADMIN.attention.reasonFollowup,
};

export function Attention({ waiting }: { waiting: Waiting[] }) {
  if (waiting.length === 0) {
    return (
      <p className="adm-notice" data-tone="ok">
        {ADMIN.attention.empty}
      </p>
    );
  }

  return (
    /* Beside the sounding field, and joined to it: pointing at a card lights
       that reservation's mark out on the plane, and holding a mark marks its
       card here. The cards are plain server-rendered links either way. */
    <HoldBridge>
      <ol className="grid gap-px bg-[var(--rule)]">
        {waiting.map((w) => (
          <li key={w.row.id} className="adm-card bg-[var(--surface)] px-3 py-2.5" data-ref={w.row.reference}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="min-w-0">
                <Link href={`/admin/r/${w.row.reference}`} className="adm-ref">
                  {w.row.reference}
                </Link>
                <span className="ml-2 text-[var(--ink)]">{w.row.company}</span>
              </p>
              <p className="adm-tag whitespace-nowrap">
                <span className="text-[var(--ink)]">{days(w.waitingDays)}</span> {ADMIN.attention.waiting}
              </p>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <TierMark tier={w.row.tier} score={w.row.score} />
              <span className="adm-mark">{gpu(w.row.gpuCount)}</span>
              {w.reasons.map((r) => (
                <span key={r} className="adm-mark" data-tone={r === "stalled" ? "alarm" : "caution"}>
                  {REASON[r]}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </HoldBridge>
  );
}

/**
 * Status and tier marks.
 *
 * Colour is data on the desk, never decoration, so every mark also carries
 * its label as text and never relies on the swatch alone. The bead in front
 * of a status is placed on the same depth scale the chart uses, which is how
 * a reader learns the scale without being taught it: they see the same colour
 * in the same place twice.
 */

import { STAGE_DEPTH } from "@/content";
import { STATUS_LABEL, type ReservationStatus } from "@/lib/server/schema";
import { level } from "./Plate";

export function StatusMark({ status, spam }: { status: ReservationStatus; spam?: boolean }) {
  const key: ReservationStatus = spam ? "spam" : status;
  return (
    <span className="adm-mark" data-status={key}>
      <span className="adm-bead" style={level(STAGE_DEPTH[key] ?? 0)} aria-hidden />
      {STATUS_LABEL[key]}
    </span>
  );
}

export function TierMark({ tier, score, prefix }: { tier: string; score: number; prefix?: string }) {
  return (
    <span className="adm-mark" data-tier={tier}>
      {prefix ? `${prefix} ${tier}` : tier} · {score}
    </span>
  );
}

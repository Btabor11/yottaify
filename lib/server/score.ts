import type { NewReservation, Tier } from "./schema";

/**
 * Priority score, 0–100, and a tier. A triage aid for the person reading
 * the inbox, not a promise to anyone. Recomputed whenever a row changes so
 * follow-up answers can move a lead up.
 *
 * Weights are opinions and should be tuned against what actually converts.
 * They are written out longhand so the next person can argue with them.
 */
export function scoreReservation(r: Partial<NewReservation>): { score: number; tier: Tier; reasons: string[] } {
  let s = 0;
  const why: string[] = [];

  // Capacity asked for. A full node or the whole fleet is the lead the
  // business exists for. "16+" is kept so a row from the two-node form still
  // scores rather than falling through as an evaluation.
  switch (r.gpuCount) {
    case "48":
      s += 35;
      why.push("whole fleet");
      break;
    case "32":
      s += 32;
      why.push("four nodes");
      break;
    case "24":
      s += 30;
      why.push("three nodes");
      break;
    case "16":
      s += 28;
      why.push("two nodes");
      break;
    case "8":
      s += 24;
      why.push("full node");
      break;
    case "48+":
    case "16+":
      s += 22;
      why.push("more than the fleet");
      break;
    case "4":
      s += 15;
      why.push("half node");
      break;
    default:
      s += 5;
  }

  // Start date: wants capacity when it comes online, not a year later.
  if (r.startDate) {
    const start = new Date(`${r.startDate}T00:00:00Z`).getTime();
    const months = (start - Date.now()) / (1000 * 60 * 60 * 24 * 30.4);
    if (months <= 4) {
      s += 15;
      why.push("start within four months");
    } else if (months <= 8) s += 8;
  }

  // Term appetite, from the follow-up.
  if (r.termInterest === "4-5y") {
    s += 24;
    why.push("committed 4–5y");
  } else if (r.termInterest === "2-3y") {
    s += 20;
    why.push("committed 2–3y");
  } else if (r.termInterest === "1y") {
    s += 12;
    why.push("committed ~1y");
  }
  if (r.durationMonths === "12+") s += 8;
  else if (r.durationMonths === "3-12") s += 4;

  // Spend band signals budget exists.
  if (r.currentSpend === "250k+") {
    s += 10;
    why.push("high current spend");
  } else if (r.currentSpend === "50k-250k") s += 7;
  else if (r.currentSpend === "10k-50k") s += 3;

  if (r.decisionTimeframe === "2w") {
    s += 8;
    why.push("deciding within two weeks");
  } else if (r.decisionTimeframe === "1m") s += 5;

  // Effort signals: notes and a phone number mean a person, not a tyre-kicker.
  if ((r.notes ?? "").trim().length > 80) {
    s += 5;
    why.push("substantive notes");
  }
  if (r.phone) s += 3;
  if (r.followupAt) s += 4;

  // Penalties.
  if (r.spam) {
    s = 0;
    why.length = 0;
    why.push("flagged as spam");
  }

  const score = Math.max(0, Math.min(100, Math.round(s)));
  const tier: Tier = score >= 60 ? "A" : score >= 35 ? "B" : "C";
  return { score, tier, reasons: why };
}

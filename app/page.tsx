import { redirect } from "next/navigation";
import { SITE } from "@/config/site";

/**
 * `/` points at whichever direction is the current front-runner.
 *
 * Promoting a winner to `/` for real is a two-step change: set
 * SITE.frontRunner, then (once chosen) move that direction's page files up to
 * the root and delete the others. Until then this keeps a single canonical
 * entry point so shared links do not rot.
 */
export default function Home() {
  redirect(`/${SITE.frontRunner}`);
}

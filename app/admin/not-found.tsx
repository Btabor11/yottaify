/**
 * A reference that is not on the board.
 *
 * Without this the desk fell through to the site's own 404, which renders
 * outside the admin layout — a white page, no chrome, no way back. A dead end
 * inside a tool should still look like the tool and still offer the door.
 */

import Link from "next/link";
import { ADMIN } from "@/content";

export default function AdminNotFound() {
  return (
    <section className="adm-plate adm-rise mx-auto mt-10 max-w-[38rem] text-center">
      <p className="adm-tag">{ADMIN.station}</p>
      <h1 className="adm-display mt-2 text-[1.75rem]">{ADMIN.detail.notFound}</h1>
      <p className="mx-auto mt-2 max-w-[44ch] text-[var(--ink-2)] text-pretty">{ADMIN.detail.notFoundHint}</p>
      <p className="mt-5">
        <Link href="/admin" className="adm-btn adm-btn-solid">
          {ADMIN.detail.back}
        </Link>
      </p>
    </section>
  );
}

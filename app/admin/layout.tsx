import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/config/site";
import { ADMIN } from "@/content";
import { getStore } from "@/lib/server/store";
import { adminFontClass } from "./fonts";
import { when } from "./format";
import { StationMark } from "@/components/admin/StationMark";
import "./admin.css";

export const metadata: Metadata = {
  title: `${ADMIN.title} · ${SITE.name}`,
  robots: { index: false, follow: false },
};

/** The desk reads live data on every request. Nothing here is cacheable. */
export const dynamic = "force-dynamic";

/**
 * The station rail.
 *
 * Sticky, thin, and always carrying the two things that decide whether
 * anything below it can be trusted: whether the store answered, and when this
 * page was actually built. A dashboard that cannot say how old it is asks to
 * be believed rather than read.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const store = await getStore();
  const up = await store.ping();
  const stamp = when(new Date());

  return (
    <div className={`admin ${adminFontClass} flex min-h-dvh flex-col`}>
      <a href="#admin-body" className="skip-link">
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-[var(--rule-strong)] bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[104rem] flex-wrap items-center justify-between gap-x-8 gap-y-2 px-5 py-2.5 md:px-8">
          <div className="flex items-center gap-3">
            <StationMark />
            <div className="leading-tight">
              <Link href="/admin" className="adm-display block text-[1.0625rem]">
                {ADMIN.station}
              </Link>
              <p className="adm-tag">
                {ADMIN.eyebrow} · {SITE.name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <nav aria-label={ADMIN.title} className="flex flex-wrap items-center gap-1.5">
              <Link href="/admin" className="adm-chip">
                {ADMIN.nav.board}
              </Link>
              <a href="/admin/export" className="adm-chip">
                {ADMIN.nav.export}
              </a>
              <Link href="/" className="adm-chip">
                {ADMIN.nav.site} ↗
              </Link>
              <form action="/api/admin/logout" method="post">
                <button type="submit" className="adm-chip">
                  {ADMIN.nav.logout}
                </button>
              </form>
            </nav>

            {/* Wraps rather than holding one line: the file-store label is a
                sentence long on purpose, and at 375 an unbreakable one pushed
                the whole page sideways. */}
            <p className="adm-tag flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5" role="status">
              <span className="adm-pip" data-state={up ? "up" : "down"} aria-hidden />
              <span className={up ? "text-[var(--ink-2)]" : "text-[var(--alarm)]"}>
                {up ? (store.kind === "postgres" ? ADMIN.store.postgres : ADMIN.store.file) : ADMIN.store.down}
              </span>
              <time dateTime={new Date().toISOString()} className="whitespace-nowrap text-[var(--ink-3)]">
                {stamp}
              </time>
            </p>
          </div>
        </div>
      </header>

      <main id="admin-body" className="mx-auto w-full max-w-[104rem] flex-1 px-5 py-7 md:px-8 md:py-9">
        {children}
      </main>
    </div>
  );
}

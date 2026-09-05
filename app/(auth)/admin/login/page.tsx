/**
 * The way in.
 *
 * The photograph is the chart room with nobody at it: the table lit, the
 * instruments on, nothing plotted. It is doing one job beyond atmosphere —
 * saying, before a word is read, that this is not the site. Someone who has
 * landed here by accident should know within a second that they are in the
 * wrong building.
 *
 * It is decorative and marked as such. Everything the page needs to be used
 * is text, sits above it, and is legible with the image still loading, since
 * the plate paints its own ground rather than relying on the photograph
 * behind it for contrast.
 */

import Image from "next/image";
import { SITE } from "@/config/site";
import { ADMIN } from "@/content";
import { StationMark } from "@/components/admin/StationMark";

export const dynamic = "force-dynamic";

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "";
  const error = sp.limited ? ADMIN.login.limited : sp.failed ? ADMIN.login.failed : null;

  return (
    <main className="relative flex min-h-dvh flex-col justify-center overflow-hidden px-5 py-14">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <Image src="/desk/chartroom.jpg" alt="" fill priority sizes="100vw" className="object-cover object-right" />
        {/* The plate needs a guaranteed ground, so the wash is CSS, not luck:
            opaque under the form, and thinning out to nothing over the part
            of the room worth looking at. */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(96deg, var(--bg) 0%, var(--bg) 22%, color-mix(in oklab, var(--bg) 82%, transparent) 46%, color-mix(in oklab, var(--bg) 18%, transparent) 78%, color-mix(in oklab, var(--bg) 40%, transparent) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(120% 90% at 50% 50%, transparent 42%, var(--bg) 100%)" }}
        />
      </div>

      <div className="mx-auto w-full max-w-[26rem] lg:mx-0 lg:ml-[max(2rem,8vw)]">
        <div className="flex items-center gap-3">
          <StationMark />
          <div className="leading-tight">
            <p className="adm-display text-[1.0625rem]">{ADMIN.station}</p>
            <p className="adm-tag">
              {ADMIN.eyebrow} · {SITE.name}
            </p>
          </div>
        </div>

        <section className="adm-plate adm-rise mt-5">
          <h1 className="adm-display text-[1.5rem]">{ADMIN.login.heading}</h1>
          <p className="mt-2 text-[var(--ink-2)] text-pretty">{ADMIN.login.body}</p>

          {error && (
            <p role="alert" className="adm-notice mt-4" data-tone="alarm">
              {error}
            </p>
          )}

          <form method="post" action="/api/admin/login" className="mt-5 grid gap-4">
            {next && <input type="hidden" name="next" value={next} />}
            <div>
              <label htmlFor="login-user" className="adm-tag block">
                {ADMIN.login.user}
              </label>
              <input
                id="login-user"
                name="user"
                type="text"
                required
                autoComplete="username"
                autoFocus
                className="adm-input mt-1.5"
              />
            </div>
            <div>
              <label htmlFor="login-pass" className="adm-tag block">
                {ADMIN.login.pass}
              </label>
              <input
                id="login-pass"
                name="pass"
                type="password"
                required
                autoComplete="current-password"
                className="adm-input mt-1.5"
              />
            </div>
            <button type="submit" className="adm-btn adm-btn-solid">
              {ADMIN.login.submit}
            </button>
          </form>

          <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-[var(--rule)] pt-3">
            <p className="adm-tag">{ADMIN.login.plate}</p>
            <p className="adm-tag text-[var(--ink-2)]">{ADMIN.login.plateValue}</p>
          </div>
        </section>

        <p className="mt-4 max-w-[46ch] text-[0.6875rem] text-[var(--ink-3)] text-pretty">{ADMIN.login.basicHint}</p>
      </div>

      {/* Says what the picture is, and why it is dark. Only where there is
          room for it to sit over the room rather than over the form. */}
      <p className="adm-tag absolute right-[max(1.5rem,4vw)] bottom-8 hidden max-w-[30ch] text-right leading-relaxed text-pretty lg:block">
        {ADMIN.login.caption}
      </p>
    </main>
  );
}

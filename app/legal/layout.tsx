import Link from "next/link";
import { Newsreader, Spline_Sans_Mono } from "next/font/google";
import { SITE } from "@/config/site";
import { LEGAL_NOTICE, FOOTER } from "@/content";

const serif = Newsreader({
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
  display: "swap",
  variable: "--legal-serif",
});

const mono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--legal-mono",
});

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${serif.variable} ${mono.variable} min-h-dvh`}
      style={
        {
          "--bg": "#12110f",
          "--surface": "#1a1815",
          "--ink": "#efece5",
          "--ink-2": "#a8a29a",
          "--ink-3": "#78736c",
          "--rule": "#2c2924",
          "--rule-strong": "#413d36",
          "--accent": "#e0b64a",
          "--accent-ink": "#12110f",
          "--focus": "#e0b64a",
          "--fb": "var(--legal-serif)",
          "--fd": "var(--legal-serif)",
          "--fm": "var(--legal-mono)",
          background: "var(--bg)",
          color: "var(--ink)",
        } as React.CSSProperties
      }
    >
      <a href="#legal-body" className="skip-link">
        Skip to content
      </a>

      {/* Draft marker is a site-wide banner, not a footnote. It must be the
          first thing a reader (or a legal reviewer) sees. */}
      <div className="border-b border-[var(--rule)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-[68rem] flex-wrap items-baseline gap-x-4 gap-y-1 px-6 py-3 md:px-10">
          <span className="font-[family-name:var(--fm)] text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--accent)]">
            {LEGAL_NOTICE.marker}
          </span>
          <span className="font-[family-name:var(--fm)] text-[0.6875rem] leading-relaxed text-[var(--ink-3)]">
            Not reviewed by counsel. Published so the route is reachable.
          </span>
        </div>
      </div>

      <header className="mx-auto max-w-[68rem] px-6 pt-10 md:px-10">
        <Link
          href={`/${SITE.frontRunner}`}
          className="font-[family-name:var(--fm)] text-[0.75rem] uppercase tracking-[0.2em] text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]"
        >
          ← {SITE.name}
        </Link>
      </header>

      <main id="legal-body" className="mx-auto max-w-[68rem] px-6 py-16 md:px-10 md:py-24">
        {children}
      </main>

      <footer className="mt-auto border-t border-[var(--rule)]">
        <div className="mx-auto flex max-w-[68rem] flex-col gap-6 px-6 py-10 md:flex-row md:items-start md:justify-between md:px-10">
          <p className="max-w-[42rem] font-[family-name:var(--fm)] text-[0.6875rem] leading-[1.7] text-[var(--ink-3)]">
            {FOOTER.disclosure}
          </p>
          <div className="flex shrink-0 gap-6 font-[family-name:var(--fm)] text-[0.6875rem] uppercase tracking-[0.14em] text-[var(--ink-3)]">
            <Link href="/legal/privacy" className="hover:text-[var(--ink)]">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-[var(--ink)]">
              Terms
            </Link>
            <span>{FOOTER.copyright}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

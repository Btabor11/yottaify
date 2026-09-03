"use client";

import { trackCta } from "@/lib/analytics";

/**
 * The only interactive element in D1's hero. Kept tiny and separate so the
 * hero itself stays a server component and ships no JavaScript for its text.
 */
export function D1Cta({
  href,
  children,
  location,
  variant = "solid",
}: {
  href: string;
  children: React.ReactNode;
  location: string;
  variant?: "solid" | "ghost";
}) {
  return (
    <a
      href={href}
      onClick={() => trackCta("d1", location)}
      className={variant === "ghost" ? "d1-btn d1-btn-ghost" : "d1-btn"}
    >
      {children}
      <span aria-hidden className="text-[0.875em] leading-none">
        {variant === "ghost" ? "↓" : "→"}
      </span>
    </a>
  );
}

"use client";

import { trackCta } from "@/lib/analytics";

export function D3Cta({
  href,
  children,
  location,
  variant = "solid",
  className,
}: {
  href: string;
  children: React.ReactNode;
  location: string;
  variant?: "solid" | "ghost";
  /** Layout-only additions (width, margin). Colour and type stay in `.d3-btn`. */
  className?: string;
}) {
  return (
    <a
      href={href}
      onClick={() => trackCta("d3", location)}
      className={[variant === "ghost" ? "d3-btn d3-btn-ghost" : "d3-btn", className].filter(Boolean).join(" ")}
    >
      {children}
      <span aria-hidden>{variant === "ghost" ? "↓" : "→"}</span>
    </a>
  );
}

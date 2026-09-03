"use client";

import { trackCta } from "@/lib/analytics";

export function D3Cta({
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
      onClick={() => trackCta("d3", location)}
      className={variant === "ghost" ? "d3-btn d3-btn-ghost" : "d3-btn"}
    >
      {children}
      <span aria-hidden>{variant === "ghost" ? "↓" : "→"}</span>
    </a>
  );
}

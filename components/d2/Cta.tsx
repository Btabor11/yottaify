"use client";

import { trackCta } from "@/lib/analytics";

export function D2Cta({
  href,
  children,
  location,
  variant = "solid",
}: {
  href: string;
  children: React.ReactNode;
  location: string;
  variant?: "solid" | "outline";
}) {
  return (
    <a
      href={href}
      onClick={() => trackCta("d2", location)}
      className={variant === "outline" ? "d2-btn d2-btn-outline" : "d2-btn"}
    >
      {children}
      <span aria-hidden>{variant === "outline" ? "↓" : "→"}</span>
    </a>
  );
}

"use client";

/**
 * D2's motion vocabulary, built on Motion rather than GSAP.
 *
 * The register is deliberately different from D1: no scrubbing, no scaling
 * bars, no travelling sweeps. Type settles, rules draw, figures resolve from
 * blur to sharp. Everything is short (≤ 700ms) and everything eases the same
 * way, so the page reads as one hand setting a document rather than a sequence
 * of effects.
 *
 * Under reduced motion these components render their children with no wrapper
 * animation at all — the finished page, immediately.
 */

import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/motion";

const EASE = [0.2, 0.8, 0.2, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;

/** Text and blocks: a short rise with a clip, like a line being set. */
export function Set({
  children,
  delay = 0,
  as = "div",
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  as?: "div" | "section" | "li" | "p" | "figure";
  className?: string;
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.62, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

/** A rule drawing itself from the left. The page's connective tissue. */
export function Rule({
  className = "d2-rule",
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div aria-hidden className={className} />;

  return (
    <motion.div
      aria-hidden
      className={className}
      style={{ transformOrigin: "left center" }}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.85, ease: EASE, delay }}
    />
  );
}

/** Ink hitting paper. Reserved for figures — the numbers are the point. */
export function Ink({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <span className={className}>{children}</span>;

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, filter: "blur(7px)", y: 4 }}
      whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.68, ease: EASE, delay }}
    >
      {children}
    </motion.span>
  );
}

/** Cap for staggered lists, so a long table never crawls in. */
export function stagger(index: number, step = 0.06): number {
  return Math.min(index * step, 0.45);
}

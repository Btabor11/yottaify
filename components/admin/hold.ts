"use client";

/**
 * WHICH ROW IS BEING HELD.
 *
 * One reference at a time, shared by everything on the board that can point
 * at a reservation: the sounding field, the still it fades in over, and the
 * log. Hovering a row lights its mark in the field; holding a mark lights its
 * row in the log. The picture and the table stop being two things.
 *
 * A module store rather than a context, because the parties are three sibling
 * client islands inside a server-rendered page and there is no component that
 * usefully wraps all of them. It is also why this is deliberately tiny: a
 * string, a set of listeners, and no framework at all.
 *
 * Nothing here is load-bearing. Every one of these surfaces works with the
 * channel silent, which is exactly what happens with JavaScript switched off.
 */

type Listener = (reference: string | null) => void;

const listeners = new Set<Listener>();
let current: string | null = null;

export function hold(reference: string | null): void {
  if (reference === current) return;
  current = reference;
  for (const l of listeners) l(current);
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/**
 * There is deliberately no hook here. Every consumer subscribes and writes to
 * the DOM directly, because a hover that re-renders a two-hundred-row table
 * is a hover nobody enjoys. The one place the held row becomes React state is
 * the field's own label, which owns that decision itself.
 */

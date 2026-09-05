"use client";

/**
 * A submit button that knows its form is in flight.
 *
 * Every action on the desk is a plain form post to a server action, which is
 * what makes them work with JavaScript switched off. The cost of that is the
 * dead second after a click where nothing has visibly happened and the
 * obvious thing to do is click again — which, on "Advance", moves a lead two
 * stages.
 *
 * So: disabled while pending, `aria-busy` for anyone listening, and a
 * travelling hairline under the label. The label itself never changes. A
 * button that swaps its text for "Saving…" changes width, and a control that
 * resizes while you are looking at it is worse than one that says nothing.
 *
 * Without JavaScript `useFormStatus` never reports pending and this is an
 * ordinary submit button, which is the whole point.
 */

import { useFormStatus } from "react-dom";

export function Submit({
  children,
  className = "adm-btn",
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button
      {...rest}
      type="submit"
      className={className}
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      data-pending={pending || undefined}
    >
      {children}
    </button>
  );
}

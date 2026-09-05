/**
 * The station mark.
 *
 * A sounding rose: the arcs a signal makes leaving a transducer, and the
 * plumb line it travels down. Drawn rather than imaged so it stays crisp at
 * any density and costs one element, and deliberately not a logo — the
 * company's identity lives on the site, and this is the room behind it.
 */

export function StationMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden focusable="false" className="shrink-0">
      <circle cx="13" cy="13" r="12" fill="none" stroke="var(--rule-strong)" strokeWidth="1" />
      <path d="M13 4v18" stroke="var(--edge)" strokeWidth="1" />
      <path d="M4 13h18" stroke="var(--rule-strong)" strokeWidth="1" />
      {/* Three returns, fainter as they travel. */}
      <path d="M8.4 9.2a6.4 6.4 0 0 1 9.2 0" fill="none" stroke="var(--accent)" strokeWidth="1.3" opacity="0.9" />
      <path d="M6.2 12.1a9.6 9.6 0 0 1 13.6 0" fill="none" stroke="var(--accent)" strokeWidth="1.1" opacity="0.5" />
      <path d="M4.4 15.1a12.2 12.2 0 0 1 17.2 0" fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.24" />
      <circle cx="13" cy="19.6" r="2" fill="var(--accent)" />
    </svg>
  );
}

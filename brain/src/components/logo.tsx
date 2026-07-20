/** DailyOS brand glyph — cyclic arrows wrapping a check. Terracotta, like the
 *  main app; the per-app colour lives only in the home-screen icon, never here. */
export function Logo({ withText = true }: { withText?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true" style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id="dos-mark" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#E0864F" />
            <stop offset="1" stopColor="#9A3412" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#dos-mark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 21v-5h5" />
          <path d="M8.5 12.2l2.4 2.4 4.6-5.4" strokeWidth="2.4" />
        </g>
      </svg>
      {withText && (
        <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
          <span style={{ color: "#bf502b" }}>Daily</span>
          <span style={{ color: "#1c1a17" }}>OS</span>
          <span style={{ color: "#8a7d6d", fontWeight: 600 }}>&nbsp;Brain</span>
        </span>
      )}
    </span>
  );
}

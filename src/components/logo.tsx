import { cn } from "@/lib/utils";

/** Brand glyph: cyclic arrows wrapping a check — "chaos into clarity". */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="dos-mark" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E0864F" />
          <stop offset="1" stopColor="#9A3412" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        stroke="url(#dos-mark)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* cyclic arrows */}
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
        {/* check */}
        <path d="M8.5 12.2l2.4 2.4 4.6-5.4" strokeWidth="2.4" />
      </g>
    </svg>
  );
}

/** DailyOS wordmark + glyph, with optional tagline. */
export function Logo({
  className,
  withText = true,
  tagline = false,
}: {
  className?: string;
  withText?: boolean;
  tagline?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="size-8 shrink-0" />
      {withText && (
        <span className="flex flex-col leading-none">
          <span className="text-lg font-bold tracking-tight">
            <span className="text-primary">Daily</span>
            <span className="text-foreground">OS</span>
          </span>
          {tagline && (
            <span className="mt-0.5 text-[11px] font-medium text-muted-foreground">
              Chaos into Clarity
            </span>
          )}
        </span>
      )}
    </span>
  );
}

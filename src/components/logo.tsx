import { cn } from "@/lib/utils";

/** DailyOS wordmark + glyph. */
export function Logo({
  className,
  withText = true,
}: {
  className?: string;
  withText?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-5"
          aria-hidden="true"
        >
          <path
            d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3H4V7Z"
            fill="currentColor"
            opacity="0.55"
          />
          <path
            d="M4 11h16v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6Z"
            fill="currentColor"
          />
          <circle cx="12" cy="15" r="1.6" fill="hsl(var(--primary))" />
        </svg>
      </span>
      {withText && (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          DailyOS
        </span>
      )}
    </span>
  );
}

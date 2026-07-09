import Link from "next/link";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

/** A "Home" link back to the app (Today). Shown on pages that don't have the
 *  main top navigation, so you can always get back with one tap. */
export function HomeButton({ className }: { className?: string }) {
  return (
    <Link
      href="/today"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      <Home className="size-4" /> Home
    </Link>
  );
}

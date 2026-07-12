"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircleMore } from "lucide-react";

/**
 * Always-on floating button that opens Ask DailyOS. Sits in the bottom-right
 * corner on every app screen (above the mobile bottom bar). Hidden while
 * already on the assistant.
 */
export function AssistantFab() {
  const pathname = usePathname();
  if (pathname.startsWith("/assistant")) return null;

  return (
    <Link
      href="/assistant"
      aria-label="Ask DailyOS"
      title="Ask DailyOS"
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated transition-transform hover:scale-105 active:scale-95 md:bottom-6 md:right-6"
    >
      <MessageCircleMore className="size-6" />
    </Link>
  );
}

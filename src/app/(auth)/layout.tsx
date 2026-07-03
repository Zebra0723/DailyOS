import Link from "next/link";
import { Logo, LogoMark } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex flex-col">
        <div className="container flex h-16 items-center">
          <Link href="/">
            <Logo tagline />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <div className="container flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-6 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <span>© 2026 DailyOS</span>
        </div>
      </div>

      {/* Right: brand panel */}
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative flex h-full flex-col p-12 text-primary-foreground">
          {/* Big logo, sitting up in the open space at the top */}
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="grid size-32 place-items-center rounded-[2rem] bg-white shadow-elevated">
              <LogoMark className="size-24" />
            </div>
            <span className="mt-6 text-4xl font-extrabold tracking-tight">
              DailyOS
            </span>
            <span className="mt-1 text-base text-primary-foreground/80">
              Chaos into Clarity
            </span>
          </div>

          {/* Quote anchored toward the bottom */}
          <div className="pb-4">
            <blockquote className="max-w-md text-2xl font-semibold leading-snug">
              Turn tomorrow into a better tomorrow, sign up now.
            </blockquote>
            <p className="mt-6 max-w-md text-primary-foreground/80">
              Drop in receipts, bookings, school letters and screenshots — and
              let DailyOS sort them into tasks, calendar events and a searchable
              vault.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

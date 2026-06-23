import Link from "next/link";
import { Logo } from "@/components/logo";

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
            <Logo />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      {/* Right: brand panel */}
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative flex h-full flex-col justify-center p-12 text-primary-foreground">
          <blockquote className="max-w-md text-2xl font-semibold leading-snug">
            “DailyOS turns life admin into handled.”
          </blockquote>
          <p className="mt-6 max-w-md text-primary-foreground/80">
            Drop in receipts, bookings, school letters and screenshots — and let
            DailyOS sort them into tasks, calendar events and a searchable
            vault.
          </p>
        </div>
      </div>
    </div>
  );
}

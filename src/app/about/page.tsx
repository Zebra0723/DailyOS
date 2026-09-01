import Link from "next/link";
import { Logo, LogoMark } from "@/components/logo";
import { HomeButton } from "@/components/home-button";

export const metadata = {
  title: "About us · DailyOS",
  description:
    "How DailyOS began — two friends, a basement in Chelsea, and one idea: make life better for people.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container flex h-16 items-center justify-between">
        <Link href="/">
          <Logo tagline />
        </Link>
        <HomeButton />
      </header>

      <main className="container flex-1 py-10 sm:py-14">
        <article className="mx-auto max-w-2xl">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            About Us
          </h1>

          <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            <p>
              DailyOS started in a basement in Chelsea, when two friends sat down
              with a single idea: <em>&ldquo;Let&rsquo;s make life better for
              people.&rdquo;</em>
            </p>
            <p>
              That was the whole brief. Not a business plan, not a pitch deck —
              just a feeling that the small, boring, never-ending admin of
              everyday life takes up far too much of it, and that it really
              didn&rsquo;t have to be that way. So we started building.
            </p>
            <p>
              It began under a different name —{" "}
              <span className="font-medium text-foreground">LifeSort</span> — but
              the more we built, the more we realised the word didn&rsquo;t fit.
              We weren&rsquo;t trying to help people file their lives away into
              neat little folders; we were trying to give them their time back.
              So we renamed it{" "}
              <span className="font-medium text-foreground">DailyOS</span>: an
              operating system for your day, built around one belief —{" "}
              <span className="font-medium text-foreground">
                simplicity in everyday life
              </span>
              .
            </p>
            <p>
              Everything we make comes back to that. Drop in the mess — the
              receipts, the letters, the bookings, the reminders — and let DailyOS
              quietly turn it into something calm and handled. No clutter, no
              busywork, no guilt. Just your life, taken care of, so you can get on
              with the parts that actually matter.
            </p>
            <p>
              We&rsquo;re still two friends with that same idea, building
              carefully and listening closely to the people who use it. Thank you
              for being part of the story.
            </p>
          </div>

          <div className="mt-8 border-t pt-6">
            <p className="text-[15px] leading-relaxed text-foreground">
              With love,
              <br />
              <span className="font-display font-semibold">
                The DailyOS leadership team
              </span>
              <br />
              Arjun &amp; Leo
            </p>

            {/* DailyOS logo with a cursive "leadership team, 2026" under the wordmark */}
            <div className="mt-6 inline-flex items-center gap-3">
              <LogoMark className="size-10 shrink-0" />
              <span className="flex flex-col leading-none">
                <span className="text-xl font-bold tracking-tight">
                  <span className="text-primary">Daily</span>
                  <span className="text-foreground">OS</span>
                </span>
                <span
                  className="mt-1.5 text-[15px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-cursive)" }}
                >
                  dailyos leadership team, 2026
                </span>
              </span>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card transition-colors hover:bg-primary/90"
            >
              Try DailyOS
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Get in touch
            </Link>
          </div>

          {/* Affiliates */}
          <div className="mt-12 border-t pt-8">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Affiliates
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              DailyOS is part of a small family of companies. See everyone
              we&rsquo;re affiliated with.
            </p>
            <Link
              href="/affiliates"
              className="mt-4 inline-flex items-center rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              View our affiliates
            </Link>
          </div>
        </article>
      </main>

      <footer className="container flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-6 text-xs text-muted-foreground">
        <Link href="/about" className="hover:text-foreground">About</Link>
        <Link href="/contact" className="hover:text-foreground">Contact</Link>
        <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link href="/terms" className="hover:text-foreground">Terms</Link>
        <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
        <span>© 2026 DailyOS</span>
      </footer>
    </div>
  );
}

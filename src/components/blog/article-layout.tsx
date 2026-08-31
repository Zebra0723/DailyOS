import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

// Shared shell for blog articles: nav, a readable article column, and a signup
// CTA. Kept deliberately simple so each post file is mostly its own content.
export function ArticleLayout({
  title,
  date,
  readingTime,
  children,
}: {
  title: string;
  date: string;
  readingTime: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/blog">Blog</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container max-w-2xl py-14">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All articles
        </Link>

        <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {date} · {readingTime}
        </p>

        <article className="article mt-10 space-y-6 text-[17px] leading-relaxed text-foreground/90">
          {children}
        </article>

        {/* Closing CTA */}
        <div className="mt-14 rounded-2xl border bg-gradient-to-br from-primary/10 via-accent/30 to-background p-8 text-center shadow-elevated">
          <h2 className="text-2xl font-bold tracking-tight">
            Let DailyOS handle the admin
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Snap a photo of any letter, receipt or booking and DailyOS turns it
            into tasks, calendar events and reminders — automatically. Free to
            start.
          </p>
          <Button size="lg" asChild className="mt-6 h-12 px-7 text-base shadow-elevated">
            <Link href="/signup">
              Get started free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </main>

      <footer className="border-t py-10">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/blog" className="hover:text-foreground">
              Blog
            </Link>
            <Link href="/tools" className="hover:text-foreground">
              Free tools
            </Link>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DailyOS
          </p>
        </div>
      </footer>
    </div>
  );
}

// Small typographic helpers so posts read well without a prose plugin.
export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="pt-4 text-2xl font-bold tracking-tight text-foreground">
      {children}
    </h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

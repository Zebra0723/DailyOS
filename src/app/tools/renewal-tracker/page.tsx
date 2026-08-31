import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { RenewalTracker } from "@/components/tools/renewal-tracker";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free Renewal & Warranty Reminder Tracker | DailyOS",
  description:
    "Never miss a renewal, free-trial end date or warranty expiry again. Add your dates and see what's coming up. Free, no sign-up, no card.",
  alternates: { canonical: `${SITE_URL}/tools/renewal-tracker` },
  openGraph: {
    title: "Free Renewal & Warranty Reminder Tracker",
    description:
      "Add your renewals, trials and warranties and see what's coming up. Free, no sign-up.",
    type: "website",
    url: `${SITE_URL}/tools/renewal-tracker`,
  },
  keywords: [
    "renewal reminder",
    "warranty tracker",
    "free trial reminder",
    "subscription renewal tracker",
    "insurance renewal reminder",
    "when does my free trial end",
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I keep track of renewal and free-trial dates?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Add each date to this free tracker and it sorts everything by how soon it's due and flags anything within 30 days, so nothing renews or expires unnoticed.",
      },
    },
    {
      "@type": "Question",
      name: "Is this renewal tracker free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — it's free, needs no sign-up and no card, and your dates stay in your own browser.",
      },
    },
    {
      "@type": "Question",
      name: "Can I get reminded before a renewal?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "This tool shows what's coming up. DailyOS goes further and sends you a notification before each renewal, trial end and warranty expiry — even when the app is closed.",
      },
    },
  ],
};

export default function RenewalTrackerPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup?ref=renewals">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container max-w-3xl py-14">
        <div className="text-center">
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Renewal &amp; Warranty Reminder Tracker
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-muted-foreground">
            Add your renewals, free-trial end dates and warranties, and see
            what&apos;s coming up. Free, no sign-up — it&apos;s all in your
            browser.
          </p>
        </div>

        <div className="mt-10">
          <RenewalTracker />
        </div>

        <article className="mt-16 space-y-8">
          <section>
            <h2 className="text-2xl font-bold tracking-tight">
              The dates that quietly cost you money
            </h2>
            <p className="mt-3 text-muted-foreground">
              Free trials that roll into paid plans. Insurance that auto-renews
              at a worse rate than a new customer would pay. Warranties that
              lapse the week before something breaks. None of these send a
              helpful warning — that&apos;s rather the point. Writing the dates
              down in one place, sorted by what&apos;s due next, is the simplest
              way to stop paying for things you didn&apos;t choose to.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight">
              What&apos;s worth tracking
            </h2>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Free trials</strong> — note
                the end date the day you start one.
              </li>
              <li>
                <strong className="text-foreground">Insurance renewals</strong> —
                car, home, phone, pet. Diarise a week before to shop around.
              </li>
              <li>
                <strong className="text-foreground">Warranties</strong> —
                appliances, electronics, the boiler. Claim before they lapse.
              </li>
              <li>
                <strong className="text-foreground">Annual subscriptions</strong>{" "}
                — the yearly ones you forget between renewals.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border bg-muted/30 p-6">
            <h2 className="text-xl font-bold tracking-tight">
              Let DailyOS remember for you
            </h2>
            <p className="mt-2 text-muted-foreground">
              A list only helps if you check it. DailyOS reads the date off a
              forwarded email or a photo of a letter, tracks it automatically,
              and sends you a reminder before it&apos;s due — alongside the rest
              of your life admin.
            </p>
            <Button asChild className="mt-4">
              <Link href="/signup?ref=renewals">
                Get started free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </section>
        </article>
      </main>

      <footer className="border-t py-10">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link href="/tools" className="hover:text-foreground">
              Free tools
            </Link>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
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

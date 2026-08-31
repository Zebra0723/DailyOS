import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { SubscriptionTracker } from "@/components/tools/subscription-tracker";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free Subscription Cost Tracker — See What You Really Spend | DailyOS",
  description:
    "Add your subscriptions and instantly see your true monthly and yearly spend. Free, no sign-up, no card. Find the subscriptions quietly draining your money.",
  alternates: { canonical: `${SITE_URL}/tools/subscription-tracker` },
  openGraph: {
    title: "Free Subscription Cost Tracker — See What You Really Spend",
    description:
      "Add your subscriptions and instantly see your true monthly and yearly spend. Free, no sign-up.",
    type: "website",
    url: `${SITE_URL}/tools/subscription-tracker`,
  },
  keywords: [
    "subscription tracker",
    "subscription cost calculator",
    "how much do I spend on subscriptions",
    "track subscriptions free",
    "monthly subscription calculator",
    "cancel subscriptions",
  ],
};

// A little SEO glue: FAQ structured data helps this page win the "how much am I
// spending on subscriptions" long-tail.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How can I track how much I spend on subscriptions?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Add each subscription and its billing cycle to this free tracker and it converts them all to a single monthly and yearly total, so you can see your true spend at a glance.",
      },
    },
    {
      "@type": "Question",
      name: "Is this subscription tracker free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — it's completely free, needs no sign-up and no card. Your list stays in your own browser.",
      },
    },
    {
      "@type": "Question",
      name: "How do I stop paying for subscriptions I forgot about?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Seeing every subscription and its yearly cost in one place is the first step. DailyOS then tracks renewals automatically and reminds you before each one so nothing renews unnoticed.",
      },
    },
  ],
};

export default function SubscriptionTrackerPage() {
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
              <Link href="/signup?ref=subtracker">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container max-w-3xl py-14">
        <div className="text-center">
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Free Subscription Cost Tracker
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-muted-foreground">
            Add your subscriptions and see exactly what they cost you each month
            and year. No sign-up, no card — it&apos;s all in your browser.
          </p>
        </div>

        <div className="mt-10">
          <SubscriptionTracker />
        </div>

        {/* Long-form copy for SEO + genuine helpfulness */}
        <article className="prose-dailyos mt-16 space-y-8">
          <section>
            <h2 className="text-2xl font-bold tracking-tight">
              Why it&apos;s worth knowing your real number
            </h2>
            <p className="mt-3 text-muted-foreground">
              Subscriptions are designed to be forgotten. A few pounds here, a
              &ldquo;free trial&rdquo; you meant to cancel there — and it quietly
              adds up to hundreds a year. The average household now juggles more
              than a dozen recurring payments across streaming, software, apps,
              memberships and insurance. Seeing them all in one place, converted
              to a single yearly figure, is often a genuine shock — and the first
              step to taking back control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight">
              How to actually cut your subscription spend
            </h2>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">List everything.</strong>{" "}
                Check your bank and card statements for the last three months —
                the ones you&apos;ve forgotten are the ones costing you most.
              </li>
              <li>
                <strong className="text-foreground">Convert to yearly.</strong>{" "}
                &ldquo;£9.99 a month&rdquo; feels small; &ldquo;£120 a
                year&rdquo; makes the decision honest.
              </li>
              <li>
                <strong className="text-foreground">Kill the duplicates.</strong>{" "}
                Two music services? Three streaming apps you rarely open? Pick one.
              </li>
              <li>
                <strong className="text-foreground">Catch renewals early.</strong>{" "}
                Most money is lost to trials and annual renewals that pass by
                unnoticed. A reminder a week before beats a refund request after.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border bg-muted/30 p-6">
            <h2 className="text-xl font-bold tracking-tight">
              Let DailyOS keep track for you
            </h2>
            <p className="mt-2 text-muted-foreground">
              This tracker is a snapshot. DailyOS keeps it live: forward a
              renewal email or snap a receipt and it logs the subscription,
              works out the cost, and reminds you before every renewal — next to
              the rest of your life admin: bookings, letters, warranties and
              tasks, all handled automatically.
            </p>
            <Button asChild className="mt-4">
              <Link href="/signup?ref=subtracker">
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

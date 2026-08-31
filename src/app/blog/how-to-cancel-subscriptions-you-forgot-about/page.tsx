import Link from "next/link";
import type { Metadata } from "next";
import { ArticleLayout, H2 } from "@/components/blog/article-layout";
import { getPost } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

const post = getPost("how-to-cancel-subscriptions-you-forgot-about")!;

export const metadata: Metadata = {
  title: `${post.title} | DailyOS`,
  description: post.description,
  alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
  openGraph: {
    title: post.title,
    description: post.description,
    type: "article",
    url: `${SITE_URL}/blog/${post.slug}`,
  },
};

export default function Post() {
  return (
    <ArticleLayout title={post.title} date="21 August 2026" readingTime={post.readingTime}>
      <p>
        The average person underestimates their subscription spending by a
        surprising margin. It&apos;s not carelessness — it&apos;s by design. A few
        pounds a month is small enough to ignore, free trials are easy to forget,
        and the charges are spread across cards, app stores and dates you never
        see. Here&apos;s a simple way to find every one of them and cut the ones
        you don&apos;t use.
      </p>

      <H2>1. Pull your last three months of statements</H2>
      <p>
        Open your bank and credit-card statements for the last 90 days — and your
        PayPal and app-store (Apple / Google) receipts, which hide a lot of
        subscriptions. Ninety days matters because quarterly and some annual
        charges won&apos;t show up in a single month. Go line by line and note
        anything recurring.
      </p>

      <H2>2. Write them all in one place</H2>
      <p>
        Seeing them scattered across statements is exactly why they survive. Put
        every subscription in a single list with its cost and how often it bills.
        Our free{" "}
        <Link href="/tools/subscription-tracker" className="font-medium text-primary underline-offset-4 hover:underline">
          Subscription Cost Tracker
        </Link>{" "}
        does this for you — it converts weekly, monthly, quarterly and annual
        costs into one honest monthly and yearly total. No sign-up needed.
      </p>

      <H2>3. Convert everything to a yearly number</H2>
      <p>
        &ldquo;£9.99 a month&rdquo; feels trivial. &ldquo;£120 a year&rdquo; makes
        the decision honest. Do this for each one and you&apos;ll immediately spot
        the two or three that aren&apos;t earning their keep.
      </p>

      <H2>4. Sort each into keep, cancel, or downgrade</H2>
      <p>
        For each subscription, ask three questions: Have I used it in the last
        month? Is there a free or cheaper alternative? Am I paying for a tier I
        don&apos;t need? Duplicates are the easy wins — two music services, three
        streaming apps you rarely open, overlapping cloud storage. Pick one.
      </p>

      <H2>5. Cancel properly — and note the ones you can&apos;t yet</H2>
      <p>
        Cancel the obvious ones now. Some you&apos;ll want to keep until the end of
        a period you&apos;ve already paid for — for those, write down the renewal
        date so you can cancel before it charges again. This is where most money
        leaks back out: you mean to cancel &ldquo;later&rdquo; and later never
        comes.
      </p>

      <H2>6. Set up a system so they can&apos;t creep back</H2>
      <p>
        A one-off audit feels great and then decays. Within a year you&apos;ll have
        signed up for new trials and forgotten new renewals. The fix is a system
        that tracks renewals for you and warns you before each one — so the next
        &ldquo;free&rdquo; trial doesn&apos;t quietly become a paid subscription.
        That&apos;s exactly what DailyOS does: forward a confirmation email or snap
        a receipt and it logs the subscription, works out the cost, and reminds you
        before it renews.
      </p>

      <p>
        Start with the{" "}
        <Link href="/tools/subscription-tracker" className="font-medium text-primary underline-offset-4 hover:underline">
          free tracker
        </Link>{" "}
        to get your number today, then let DailyOS keep it under control.
      </p>
    </ArticleLayout>
  );
}

import Link from "next/link";
import { Gift, Check, Sparkles, ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata = {
  title: "You've been invited to DailyOS",
  description:
    "A friend invited you to DailyOS. You get 10% off — and so do they.",
};

/** Look up the referrer's display name so we can say who invited you. */
async function referrerName(id: string): Promise<string | null> {
  try {
    const admin = createServiceClient();
    const { data } = await admin.auth.admin.getUserById(id);
    const meta = data.user?.user_metadata as
      | { username?: string }
      | undefined;
    const email = data.user?.email ?? "";
    return meta?.username || (email ? email.split("@")[0] : null);
  } catch {
    return null;
  }
}

export default async function ReferralLandingPage({
  params,
}: {
  params: { id: string };
}) {
  const name = await referrerName(params.id);
  const signupHref = `/signup?ref=${encodeURIComponent(params.id)}`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="container flex h-16 items-center">
        <Link href="/">
          <Logo tagline />
        </Link>
      </header>

      <main className="container flex flex-1 flex-col items-center justify-center py-12">
        <div className="w-full max-w-xl">
          {/* Hero card */}
          <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-accent/40 to-background p-8 text-center sm:p-10">
            <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Gift className="size-7" />
            </div>
            <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              {name ? `${name} invited you` : "You've been invited"}
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Get 10% off DailyOS — and give 10% back.
            </h1>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              {name ? `${name} uses ` : "Someone uses "}
              DailyOS to keep life admin handled. Join through this link and{" "}
              <strong className="text-foreground">you both</strong> get 10% off a
              paid plan when you subscribe.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href={signupHref}>
                  Create your account <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">I already have one</Link>
              </Button>
            </div>
          </div>

          {/* How the reward works */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Step
              n={1}
              title="Sign up free"
              body="Create your account through this link — no card needed to start."
            />
            <Step
              n={2}
              title="Go paid, save 10%"
              body="When you subscribe to Plus or Pro, your 10%-off code is emailed to you."
            />
            <Step
              n={3}
              title="They save too"
              body={`${name ? name : "The friend who invited you"} gets the same 10% off — everybody wins.`}
            />
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            The reward code lands in your inbox the moment your plan goes paid.
            Prices in GBP. Cancel anytime.
          </p>
        </div>
      </main>

      <footer className="container flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-6 text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-foreground">
          Terms
        </Link>
        <span>© 2026 DailyOS</span>
      </footer>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 text-left shadow-card">
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {n}
        </span>
        <Check className="size-4 text-primary" />
      </div>
      <h3 className="mt-3 font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

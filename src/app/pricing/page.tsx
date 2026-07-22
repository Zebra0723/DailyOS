import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/logo";
import { HomeButton } from "@/components/home-button";
import { Button } from "@/components/ui/button";
import { PLANS, annualPerMonth, annualSavingPct } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Pricing · DailyOS",
  description:
    "DailyOS pricing — a free plan, Plus and Pro. Simple annual pricing in GBP, cancel any time.",
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container flex h-16 items-center justify-between">
        <Link href="/">
          <Logo tagline />
        </Link>
        <HomeButton />
      </header>

      <main className="container flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Simple pricing for a handled life
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Start free. Upgrade when DailyOS is doing enough of your life admin to
              be worth it. Prices in GBP, billed annually — cancel any time.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANS.map((plan) => {
              const free = plan.annual === 0;
              const saving = annualSavingPct(plan);
              return (
                <div
                  key={plan.key}
                  className={cn(
                    "relative flex flex-col rounded-3xl border bg-card p-6 shadow-card",
                    plan.highlight && "border-primary/50 shadow-elevated",
                  )}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Most popular
                    </div>
                  )}
                  <h2 className="text-lg font-bold">{plan.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

                  <div className="mt-5 flex items-end gap-1.5">
                    {free ? (
                      <span className="text-4xl font-bold">£0</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">£{annualPerMonth(plan)}</span>
                        <span className="pb-1 text-muted-foreground">/mo</span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 h-5 text-xs text-muted-foreground">
                    {free ? "Free forever" : `Billed £${plan.annual}/year · save ${saving}%`}
                  </p>

                  <Button
                    asChild
                    variant={plan.highlight ? "default" : "outline"}
                    className="mt-5 w-full"
                  >
                    <Link href="/signup">{plan.cta}</Link>
                  </Button>

                  <ul className="mt-6 space-y-2.5 text-sm">
                    {plan.features.map((f) => {
                      const isHeader = f.endsWith(":");
                      const isNegative = f.toLowerCase().startsWith("no ");
                      return (
                        <li key={f} className="flex items-start gap-2.5">
                          {isHeader ? (
                            <span className="font-medium text-foreground">{f}</span>
                          ) : (
                            <>
                              <Check
                                className={cn(
                                  "mt-0.5 size-4 shrink-0",
                                  isNegative ? "text-muted-foreground/40" : "text-primary",
                                )}
                              />
                              <span className={cn(isNegative && "text-muted-foreground")}>{f}</span>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-sm text-muted-foreground">
            Have a code? Enter it at checkout after signing up. Questions?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Get in touch
            </Link>
            .
          </p>
        </div>
      </main>

      <footer className="container flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-6 text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link href="/terms" className="hover:text-foreground">Terms</Link>
        <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
        <span>© 2026 DailyOS</span>
      </footer>
    </div>
  );
}

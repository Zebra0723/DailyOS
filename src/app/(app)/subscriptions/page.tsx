import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PricingTable } from "@/components/pricing-table";

export const metadata = { title: "Subscription · DailyOS" };

export default async function SubscriptionsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-4xl">
      {/* Hero */}
      <div className="mb-8 overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-accent/40 to-background p-8 text-center sm:p-10">
        <div className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" /> Your plan
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Choose your level of handled.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          From a free start to your own AI chief of staff. Upgrade, downgrade or
          cancel anytime — and if you&apos;ve got a code, drop it in below.
        </p>
      </div>

      <PricingTable userId={user?.id} />
    </div>
  );
}

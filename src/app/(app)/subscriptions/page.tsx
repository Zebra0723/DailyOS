import { Sparkles, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PricingTable } from "@/components/pricing-table";
import { InviteButton } from "@/components/invite-button";
import { ReferralLadder } from "@/components/referral-ladder";
import { MyRewardCodes } from "@/components/my-reward-codes";
import { getReferralSummary } from "@/app/(app)/subscriptions/referral-actions";
import { getMyRewardCodes } from "@/app/(app)/subscriptions/reward-code-actions";

export const metadata = { title: "Subscription · DailyOS" };

export default async function SubscriptionsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const referrals = await getReferralSummary();
  const rewardCodes = await getMyRewardCodes();

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

      {/* Refer a friend — 10% off for both */}
      <div className="mt-10 overflow-hidden rounded-3xl border bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Gift className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">
                Refer friends, unlock rewards
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Share your one-of-a-kind link. Your friend gets{" "}
                <strong className="text-foreground">10% off</strong>, and the
                more friends who subscribe, the bigger your reward — up to{" "}
                <strong className="text-foreground">lifetime Pro</strong>.
              </p>
              <a
                href="#reward-codes"
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                See your reward codes →
              </a>
            </div>
          </div>
          <div className="shrink-0">
            <InviteButton userId={user?.id} />
          </div>
        </div>

        {referrals.total > 0 && (
          <div className="mt-6 flex gap-6 border-t pt-5 text-sm">
            <div>
              <div className="text-2xl font-semibold">{referrals.total}</div>
              <div className="text-muted-foreground">Invited</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                {referrals.converted}
              </div>
              <div className="text-muted-foreground">Subscribed</div>
            </div>
          </div>
        )}

        <MyRewardCodes codes={rewardCodes} />

        <ReferralLadder converted={referrals.converted} />
      </div>
    </div>
  );
}

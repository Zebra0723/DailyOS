"use client";

import * as React from "react";
import { UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/** Share / copy a personal referral link. It points at a one-of-a-kind referral
 *  page (/r/<your id>) that explains the 10%-off-for-both deal and sends the
 *  friend on to sign up attributed to you. When they land on a paid plan, both
 *  of you are emailed the DAILYOSFRIEND10 (10% off) code.
 *  Uses the native share sheet on mobile, falls back to copying the link. */
export function InviteButton({ userId }: { userId?: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  function referralUrl() {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    // No id → fall back to a plain signup link (shouldn't happen for a
    // signed-in user, but keeps the button safe).
    return userId ? `${base}/r/${encodeURIComponent(userId)}` : `${base}/signup`;
  }

  async function invite() {
    const url = referralUrl();
    const shareData = {
      title: "DailyOS — 10% off",
      text: "I'm using DailyOS to handle life admin. Join through my link and we both get 10% off:",
      url,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      /* user cancelled or unsupported — fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ variant: "success", title: "Referral link copied" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "info", title: url });
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={invite}>
      {copied ? <Check className="size-4" /> : <UserPlus className="size-4" />}
      Invite a friend
    </Button>
  );
}

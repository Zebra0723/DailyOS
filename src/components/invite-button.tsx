"use client";

import * as React from "react";
import { UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/** Share / copy an invite link to DailyOS. Uses the native share sheet on
 *  mobile, falls back to copying the link. */
export function InviteButton() {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  async function invite() {
    const url =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const shareData = {
      title: "DailyOS",
      text: "I'm using DailyOS to handle life admin — give it a try:",
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
      toast({ variant: "success", title: "Invite link copied" });
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

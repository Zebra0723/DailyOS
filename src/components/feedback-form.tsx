"use client";

import * as React from "react";
import { Loader2, Send } from "lucide-react";
import { submitFeedback } from "@/app/(app)/settings/feedback-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

export function FeedbackForm() {
  const { toast } = useToast();
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function send() {
    if (!message.trim()) return;
    setBusy(true);
    const res = await submitFeedback(message);
    setBusy(false);
    if (res.ok) {
      setMessage("");
      toast({ variant: "success", title: "Thanks — feedback sent" });
    } else {
      toast({ variant: "error", title: "Couldn't send", description: res.error });
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Found a bug or have an idea? Tell us here…"
        rows={3}
      />
      <Button onClick={send} disabled={busy || !message.trim()}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Send feedback
      </Button>
    </div>
  );
}

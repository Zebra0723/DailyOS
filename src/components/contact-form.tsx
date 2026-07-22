"use client";

import * as React from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitContact } from "@/app/contact/contact-actions";

/** Public "send us a message" form — a real channel that lands in Support,
 *  so the Contact page is never a dead end even before email inboxes exist. */
export function ContactForm() {
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [state, setState] = React.useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = React.useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setState("sending");
    const res = await submitContact(email, message);
    if (res.ok) {
      setState("done");
    } else {
      setError(res.error ?? "Something went wrong — please try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-3xl border bg-card p-6 text-center shadow-card sm:p-8">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <CheckCircle2 className="size-6" />
        </div>
        <h2 className="font-display text-xl font-semibold tracking-tight">Message sent</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Thanks for reaching out — we&apos;ve got it and aim to reply within 2 working days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border bg-card p-6 shadow-card sm:p-8">
      <h2 className="font-display text-xl font-semibold tracking-tight">Send us a message</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        No account needed — leave your email and we&apos;ll get back to you.
      </p>
      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contact-email">Your email</Label>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-message">Message</Label>
          <textarea
            id="contact-message"
            rows={5}
            placeholder="How can we help?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" loading={state === "sending"}>
          <Send className="size-4" /> Send message
        </Button>
      </div>
    </form>
  );
}

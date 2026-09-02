"use client";

import * as React from "react";
import { Ticket, Copy, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { generateStripeCode } from "./actions";

export function CodesForm({ stripeReady }: { stripeReady: boolean }) {
  const { toast } = useToast();
  const [discountKind, setDiscountKind] = React.useState<"percent" | "amount">("percent");
  const [value, setValue] = React.useState("20");
  const [durationKind, setDurationKind] =
    React.useState<"once" | "forever" | "repeating">("once");
  const [durationMonths, setDurationMonths] = React.useState("3");
  const [code, setCode] = React.useState("");
  const [maxRedemptions, setMaxRedemptions] = React.useState("");
  const [expiresInDays, setExpiresInDays] = React.useState("");
  const [firstTimeOnly, setFirstTimeOnly] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [created, setCreated] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function copy(c: string) {
    try {
      await navigator.clipboard.writeText(c);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "info", title: c });
    }
  }

  async function generate() {
    setBusy(true);
    setCreated(null);
    try {
      const res = await generateStripeCode({
        discountKind,
        value: Number(value) || 0,
        durationKind,
        durationMonths: Number(durationMonths) || 1,
        code: code || undefined,
        maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined,
        firstTimeOnly,
      });
      if (res.ok && res.code) {
        setCreated(res.code);
        setCode("");
        toast({ variant: "success", title: `Code created: ${res.code}` });
      } else {
        toast({ variant: "error", title: res.error ?? "Couldn't create the code." });
      }
    } catch {
      toast({ variant: "error", title: "Couldn't create the code." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="size-5 text-primary" /> Generate a Stripe code
        </CardTitle>
        <CardDescription>
          Every code is a real Stripe promotion code. Customers enter it on the
          Stripe checkout page to get the discount — nothing is redeemed inside
          DailyOS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!stripeReady && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
            Stripe isn&apos;t configured yet (no <code>STRIPE_SECRET_KEY</code>).
            You can fill this in, but generating a code will fail until the key
            is set.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Discount type</Label>
            <Select
              value={discountKind}
              onChange={(e) => setDiscountKind(e.target.value as "percent" | "amount")}
            >
              <option value="percent">Percent off (%)</option>
              <option value="amount">Fixed amount off (£)</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{discountKind === "percent" ? "Percent off" : "Amount off (£)"}</Label>
            <Input
              type="number"
              min={1}
              max={discountKind === "percent" ? 100 : undefined}
              step={discountKind === "percent" ? 1 : 0.01}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Applies for</Label>
            <Select
              value={durationKind}
              onChange={(e) =>
                setDurationKind(e.target.value as "once" | "forever" | "repeating")
              }
            >
              <option value="once">One billing period</option>
              <option value="repeating">A number of months</option>
              <option value="forever">Forever</option>
            </Select>
          </div>
          {durationKind === "repeating" && (
            <div className="space-y-1.5">
              <Label>Months</Label>
              <Input
                type="number"
                min={1}
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Custom code (optional)</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. LAUNCH20 — leave blank to auto-generate"
            autoCapitalize="characters"
            className="uppercase placeholder:normal-case"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Max redemptions (optional)</Label>
            <Input
              type="number"
              min={1}
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="Unlimited"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Expires in days (optional)</Label>
            <Input
              type="number"
              min={1}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              placeholder="Never"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={firstTimeOnly}
            onChange={(e) => setFirstTimeOnly(e.target.checked)}
            className="size-4 rounded border-input"
          />
          First-time customers only
        </label>

        <Button onClick={generate} loading={busy} disabled={busy}>
          Generate code
        </Button>

        {created && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <div className="min-w-0">
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                New code
              </p>
              <p className="truncate font-mono text-lg font-semibold text-emerald-800 dark:text-emerald-300">
                {created}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => copy(created)}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              Copy
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

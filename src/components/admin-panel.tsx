"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Home, Sparkles, FlaskConical, Bot, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { usePlan, setAdmin } from "@/lib/use-pro";
import { testAIConnection, type AITestResult } from "@/app/(app)/settings/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * Owner-only controls, unlocked by the admin code (just Arjun & Leo).
 * Renders nothing for everyone else, so normal accounts never see it.
 */
export function AdminPanel({ userId }: { userId?: string }) {
  const { mounted, admin } = usePlan(userId);
  const { toast } = useToast();
  const [aiBusy, setAiBusy] = React.useState(false);
  const [aiResult, setAiResult] = React.useState<AITestResult | null>(null);

  if (!mounted || !admin) return null;

  function turnOff() {
    void setAdmin(false, userId);
    toast({ variant: "info", title: "Admin access turned off on this device" });
  }

  async function runAiTest() {
    setAiBusy(true);
    setAiResult(null);
    try {
      setAiResult(await testAIConnection());
    } catch {
      setAiResult({
        ok: false,
        configured: false,
        model: "",
        host: "",
        error: "Test failed to run.",
      });
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <Card className="border-primary/30 bg-accent/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4 text-primary" /> Owner tools
          <Badge variant="success">Admin</Badge>
        </CardTitle>
        <CardDescription>
          For Arjun &amp; Leo only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <Home className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <strong>HomeOS demo data</strong> — load a fully populated example
              home from the HomeOS dashboard or its settings. Regular accounts
              don&apos;t get this.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <strong>Pro on every feature</strong> — HomeOS, Vault and Build My
              Day are all unlocked.
            </span>
          </li>
        </ul>
        {/* Ask DailyOS connection test — surfaces the REAL provider error. */}
        <div className="rounded-lg border bg-background p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Bot className="size-4 text-primary" /> Ask DailyOS connection
            </span>
            <Button size="sm" variant="outline" onClick={runAiTest} disabled={aiBusy}>
              {aiBusy ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
              Test AI
            </Button>
          </div>
          {aiResult && (
            <div
              className={
                "mt-3 rounded-md border p-2.5 text-sm " +
                (aiResult.ok
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-destructive/30 bg-destructive/5")
              }
            >
              <p className="flex items-center gap-1.5 font-medium">
                {aiResult.ok ? (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-500" /> AI is
                    reachable
                  </>
                ) : (
                  <>
                    <XCircle className="size-4 text-destructive" /> AI call
                    failed
                  </>
                )}
              </p>
              {aiResult.error && (
                <p className="mt-1 break-words text-destructive">{aiResult.error}</p>
              )}
              {aiResult.sample && (
                <p className="mt-1 break-words text-muted-foreground">
                  Response: {aiResult.sample}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                model: {aiResult.model || "—"} · host: {aiResult.host || "—"}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/admin">
              <FlaskConical className="size-4" /> Open testing console
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={turnOff}>
            Turn off admin on this device
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

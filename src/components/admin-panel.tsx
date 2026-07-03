"use client";

import * as React from "react";
import { ShieldCheck, Home, Sparkles } from "lucide-react";
import { usePlan, setAdmin } from "@/lib/use-pro";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * Owner-only controls, unlocked by the ARLEOPRO code (just Arjun & Leo).
 * Renders nothing for everyone else, so normal accounts never see it.
 */
export function AdminPanel({ userId }: { userId?: string }) {
  const { mounted, admin } = usePlan(userId);
  const { toast } = useToast();

  if (!mounted || !admin) return null;

  function turnOff() {
    void setAdmin(false, userId);
    toast({ variant: "info", title: "Admin access turned off on this device" });
  }

  return (
    <Card className="border-primary/30 bg-accent/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4 text-primary" /> Owner tools
          <Badge variant="success">Admin</Badge>
        </CardTitle>
        <CardDescription>
          Unlocked by the ARLEOPRO code — for Arjun &amp; Leo only.
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
        <Button variant="outline" size="sm" onClick={turnOff}>
          Turn off admin on this device
        </Button>
      </CardContent>
    </Card>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export function ResetPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = React.useMemo(() => createClient(), []);

  const [ready, setReady] = React.useState(false);
  const [validLink, setValidLink] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // The reset link signs the user in with a temporary recovery session.
  // If there's no session, the link was missing/expired.
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setValidLink(Boolean(data.user));
      setReady(true);
    });
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      return setError("Use at least 6 characters.");
    }
    if (password !== confirm) {
      return setError("Those passwords don't match.");
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ variant: "success", title: "Password updated" });
      router.push("/today");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!validLink) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold">Link expired</h2>
        <p className="text-sm text-muted-foreground">
          This password reset link is invalid or has expired. Request a fresh one
          and try again.
        </p>
        <Button className="w-full" asChild>
          <Link href="/forgot-password">Send a new link</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={6}
          required
        />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Update password
      </Button>
    </form>
  );
}

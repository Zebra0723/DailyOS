"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export function UsernameForm({ initialUsername }: { initialUsername: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = React.useMemo(() => createClient(), []);

  const [username, setUsername] = React.useState(initialUsername);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const dirty = username.trim() !== initialUsername.trim();

  async function save() {
    const value = username.trim();
    if (!value) return setError("Username can't be empty.");
    if (value.length > 40) return setError("Keep it under 40 characters.");
    setError(null);
    setSaving(true);
    // Stored on the auth user's metadata — no extra table needed.
    const { error } = await supabase.auth.updateUser({
      data: { username: value },
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    toast({ variant: "success", title: "Username updated" });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="username">Display name</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="What should we call you?"
          maxLength={40}
        />
      </div>
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || !dirty}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}

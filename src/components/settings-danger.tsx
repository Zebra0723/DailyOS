"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteAllData, deleteAccount } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";

export function SettingsDanger() {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = React.useState<"data" | "account" | null>(null);

  async function clearData() {
    if (
      !(await confirm({
        title: "Delete all your data?",
        description:
          "Every Drop item, task, event and uploaded file. Your login is kept.",
        confirmText: "Delete everything",
        destructive: true,
      }))
    )
      return;
    setBusy("data");
    const res = await deleteAllData();
    setBusy(null);
    if (res.ok) {
      toast({ variant: "success", title: "All data deleted" });
      router.refresh();
    } else {
      toast({ variant: "error", title: "Could not delete data" });
    }
  }

  async function removeAccount() {
    if (
      !(await confirm({
        title: "Permanently delete your account?",
        description: "Your account and everything in it will be removed.",
        confirmText: "Delete account",
        destructive: true,
      }))
    )
      return;
    setBusy("account");
    const res = await deleteAccount();
    if (res.ok) {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast({ variant: "success", title: "Account deleted" });
      router.push("/");
      return;
    }
    setBusy(null);
    toast({
      variant: "error",
      title: "Could not fully delete account",
      description: res.error,
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Delete all data</p>
          <p className="text-sm text-muted-foreground">
            Wipe every Drop item, task, event and uploaded file. Keeps your login.
          </p>
        </div>
        <Button
          variant="outline"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={clearData}
          disabled={busy !== null}
        >
          {busy === "data" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          Delete data
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-destructive">Delete account</p>
          <p className="text-sm text-muted-foreground">
            Permanently remove your account and all associated data.
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={removeAccount}
          disabled={busy !== null}
        >
          {busy === "account" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          Delete account
        </Button>
      </div>
    </div>
  );
}

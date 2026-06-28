"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Laptop, Loader2, LogOut, ShieldAlert, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePro } from "@/lib/use-pro";
import {
  DEVICE_LIMITS,
  deviceLabel,
  getDeviceId,
  type DeviceRecord,
} from "@/lib/devices";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

// Re-stamp "last seen" at most this often to avoid writing on every page load.
const LAST_SEEN_REFRESH_MS = 6 * 60 * 60 * 1000;

/**
 * Registers this browser as a device on the account and, for Free accounts,
 * blocks access once the device limit is reached. Renders nothing while the
 * device is within limits.
 */
export function DeviceGuard() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const { mounted, pro } = usePro();

  const [blocked, setBlocked] = React.useState(false);
  const [devices, setDevices] = React.useState<DeviceRecord[]>([]);
  const [working, setWorking] = React.useState(false);
  const ran = React.useRef(false);

  React.useEffect(() => {
    // Wait until we know the plan; only run the check once per mount.
    if (!mounted || ran.current) return;
    ran.current = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const id = getDeviceId();
      const list = (user.user_metadata?.devices as DeviceRecord[] | undefined) ?? [];
      const existing = list.find((d) => d.id === id);
      const limit = pro ? DEVICE_LIMITS.pro : DEVICE_LIMITS.free;

      // Already a known device — refresh its "last seen" occasionally.
      if (existing) {
        const stale =
          new Date().getTime() - new Date(existing.lastSeen).getTime() >
          LAST_SEEN_REFRESH_MS;
        if (stale) {
          const next = list.map((d) =>
            d.id === id ? { ...d, lastSeen: new Date().toISOString() } : d,
          );
          await supabase.auth.updateUser({ data: { devices: next } });
        }
        return;
      }

      // New device with room (or unlimited on Pro) — register it.
      if (list.length < limit) {
        const next = [
          ...list,
          { id, label: deviceLabel(), lastSeen: new Date().toISOString() },
        ];
        await supabase.auth.updateUser({ data: { devices: next } });
        return;
      }

      // Over the limit — block and offer a way out.
      setDevices(list);
      setBlocked(true);
    })();
  }, [mounted, pro, supabase]);

  async function signOutOthers() {
    setWorking(true);
    const id = getDeviceId();
    const next: DeviceRecord[] = [
      { id, label: deviceLabel(), lastSeen: new Date().toISOString() },
    ];
    await supabase.auth.updateUser({ data: { devices: next } });
    setBlocked(false);
    setWorking(false);
    router.refresh();
  }

  async function logOut() {
    setWorking(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!blocked) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/95 p-6 backdrop-blur">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <ShieldAlert className="size-3.5" /> Device limit
          </span>
        </div>

        <h1 className="text-xl font-bold tracking-tight">
          You&apos;re signed in on another device
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          The Free plan covers <strong>one device</strong>. To use DailyOS here,
          sign out the other device — or upgrade to Pro for unlimited devices.
        </p>

        {devices.length > 0 && (
          <div className="mt-5 grid gap-2">
            {devices.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Laptop className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Last active {new Date(d.lastSeen).toLocaleDateString("en-GB")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-2.5">
          <Button onClick={signOutOthers} disabled={working} className="w-full">
            {working ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            Use DailyOS on this device
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/settings")}
            disabled={working}
            className="w-full"
          >
            <Sparkles className="size-4" /> Upgrade for unlimited devices
          </Button>
          <button
            onClick={logOut}
            disabled={working}
            className="mt-1 text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Log out instead
          </button>
        </div>
      </div>
    </div>
  );
}

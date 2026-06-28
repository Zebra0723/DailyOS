"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Laptop, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePro } from "@/lib/use-pro";
import { DEVICE_LIMITS, getDeviceId, type DeviceRecord } from "@/lib/devices";
import { Button } from "@/components/ui/button";

/** Lists the devices registered on the account, with the ability to remove them. */
export function DevicesManager() {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const { mounted, pro } = usePro();

  const [devices, setDevices] = React.useState<DeviceRecord[] | null>(null);
  const [thisId, setThisId] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setThisId(getDeviceId());
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setDevices(
        (user?.user_metadata?.devices as DeviceRecord[] | undefined) ?? [],
      );
    })();
  }, [supabase]);

  async function remove(id: string) {
    if (!devices) return;
    setBusyId(id);
    const next = devices.filter((d) => d.id !== id);
    await supabase.auth.updateUser({ data: { devices: next } });
    setDevices(next);
    setBusyId(null);
    if (id === thisId) {
      // Removed the current device — re-run the guard.
      router.refresh();
    }
  }

  const limit = pro ? DEVICE_LIMITS.pro : DEVICE_LIMITS.free;
  const limitLabel = pro ? "Unlimited devices on Pro" : "Free plan: 1 device";

  if (devices === null) {
    return (
      <p className="py-2 text-sm text-muted-foreground">
        <Loader2 className="mr-2 inline size-4 animate-spin" />
        Loading devices…
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {limitLabel}
        {!pro && devices.length > 0 && (
          <>
            {" "}
            · using {Math.min(devices.length, limit === Infinity ? devices.length : limit)}/
            {limit === Infinity ? "∞" : limit}
          </>
        )}
      </p>

      {devices.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          No devices registered yet.
        </p>
      ) : (
        <div className="grid gap-2">
          {devices.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                <Laptop className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-medium">
                  {d.label}
                  {d.id === thisId && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      This device
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Last active {new Date(d.lastSeen).toLocaleDateString("en-GB")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(d.id)}
                disabled={busyId === d.id}
                aria-label={`Remove ${d.label}`}
              >
                {busyId === d.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

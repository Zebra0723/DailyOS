"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Wrench } from "lucide-react";
import { ConfirmButton } from "@/components/confirm-button";
import { runCronNow, toggleMaintenance } from "@/app/hub/actions";

const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";

export function QuickActions({ cronEnabled, maintenance }: { cronEnabled: boolean; maintenance: boolean }) {
  const router = useRouter();
  const [cronPending, startCron] = useTransition();
  const [cronMsg, setCronMsg] = useState<{ ok: boolean; message: string } | null>(null);

  function onRunCron() {
    setCronMsg(null);
    startCron(async () => {
      const r = await runCronNow();
      setCronMsg(r);
    });
  }

  async function onToggleMaintenance() {
    await toggleMaintenance();
    router.refresh();
  }

  return (
    <section>
      <h2 className="mb-3 text-base font-bold">Quick actions</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Run cron */}
        <div className={card}>
          <div className="mb-1 flex items-center gap-1.5 text-[#8a8073]">
            <Play className="size-3.5" />
            <span className="text-xs font-medium">Run cron now</span>
          </div>
          <p className="mb-3 text-xs text-[#6b6157]">Fire the live app&rsquo;s scheduled-push endpoint immediately.</p>
          <button
            type="button"
            onClick={onRunCron}
            disabled={!cronEnabled || cronPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#bf502b] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#a7431f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="size-3.5" />
            {cronPending ? "Running…" : "Run now"}
          </button>
          {!cronEnabled && <p className="mt-2 text-[11px] text-[#a89b8a]">Set CRON_SECRET to enable.</p>}
          {cronMsg && (
            <p className={`mt-2 break-words text-xs ${cronMsg.ok ? "text-[#15803d]" : "text-[#c0392b]"}`}>
              {cronMsg.ok ? "✓ " : "✗ "}
              {cronMsg.message}
            </p>
          )}
        </div>

        {/* Toggle maintenance */}
        <div className={card}>
          <div className="mb-1 flex items-center gap-1.5 text-[#8a8073]">
            <Wrench className="size-3.5" />
            <span className="text-xs font-medium">Maintenance mode</span>
          </div>
          <p className="mb-3 text-xs text-[#6b6157]">
            Currently{" "}
            <b style={{ color: maintenance ? "#c0392b" : "#15803d" }}>{maintenance ? "ON" : "off"}</b>
            {maintenance ? " — users see the maintenance screen." : " — the app is live for everyone."}
          </p>
          <ConfirmButton
            label={
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ded2] bg-[#fffdf9] px-3.5 py-2 text-sm font-semibold text-[#4b443b] transition-colors hover:bg-[#f2e6da]">
                <Wrench className="size-3.5" />
                {maintenance ? "Turn maintenance OFF" : "Turn maintenance ON"}
              </span>
            }
            title={maintenance ? "Turn maintenance off?" : "Turn maintenance on?"}
            message={
              maintenance
                ? "This brings DailyOS back online for all users."
                : "This takes DailyOS offline — every user will see the maintenance screen until you turn it back off."
            }
            warn={maintenance ? undefined : "Users will be locked out of the live app."}
            confirmLabel={maintenance ? "Turn off" : "Turn ON"}
            onConfirm={onToggleMaintenance}
          />
        </div>
      </div>
    </section>
  );
}

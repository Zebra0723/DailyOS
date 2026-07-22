import { ArrowUpRight } from "lucide-react";
import { pingApps, appLinks } from "@/lib/hub";

export const dynamic = "force-dynamic";

const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";

export default async function AppsPage() {
  const [pings, apps] = await Promise.all([pingApps(), Promise.resolve(appLinks())]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Apps</h1>
        <p className="text-sm text-[#6b6157]">Are my apps alive? Live up/down status and latency for every sibling app.</p>
      </div>

      <section>
        <div className="grid gap-3 sm:grid-cols-2">
          {apps.map((a) => {
            const ping = pings[a.key];
            const inner = (
              <div className="flex items-start gap-3">
                <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: a.dot }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    DailyOS {a.label}
                    {a.url && <ArrowUpRight className="size-3.5 text-[#a89b8a]" />}
                    {ping && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-[#8a8073]">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: ping.ok ? "#15803d" : "#c0392b" }}
                          aria-label={ping.ok ? "up" : "down"}
                        />
                        {ping.ok ? (ping.ms === null ? "up" : `${ping.ms} ms`) : "down"}
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs text-[#6b6157]">{a.blurb}</div>
                  {!a.url && <div className="mt-1 text-[11px] text-[#a89b8a]">Set HUB_{a.key.toUpperCase()}_URL to link it</div>}
                </div>
              </div>
            );
            return a.url ? (
              <a key={a.key} href={a.url} target="_blank" rel="noreferrer" className={`${card} transition-colors hover:border-[#d9a38f]`}>{inner}</a>
            ) : (
              <div key={a.key} className={`${card} opacity-70`}>{inner}</div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-[#a89b8a]">Each card pings the app&rsquo;s configured URL. Unlinked apps need their HUB_*_URL env set.</p>
      </section>
    </div>
  );
}

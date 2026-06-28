"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useHomeOS } from "@/lib/homeos/store";
import { searchHomeOS } from "@/lib/homeos/search";
import { Modal, ModuleBadge } from "@/components/homeos/ui";
import { Input } from "@/components/ui/input";
import type { HomeModule } from "@/lib/homeos/types";

const MODULE_SEG: Record<HomeModule, string> = {
  SubscriptionOps: "subscriptions",
  ArrivalOps: "arrivals",
  RoomOps: "rooms",
  DeviceOps: "devices",
  "Home Vault": "vault",
  HomeOS: "alerts",
};

export function HomeSearch({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (seg: string) => void;
}) {
  const { data } = useHomeOS();
  const [q, setQ] = React.useState("");
  const results = React.useMemo(() => searchHomeOS(q, data), [q, data]);

  function go(module: HomeModule) {
    onNavigate(MODULE_SEG[module]);
    setQ("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Search HomeOS">
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Subscriptions, arrivals, rooms, devices, documents…"
            className="pl-9"
          />
        </div>

        {q && results.total === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No matches for “{q}”.
          </p>
        )}

        {results.groups.map((g) => (
          <div key={g.module}>
            <div className="mb-1.5 flex items-center gap-2">
              <ModuleBadge module={g.module} />
              <span className="text-xs text-muted-foreground">{g.hits.length}</span>
            </div>
            <div className="grid gap-1.5">
              {g.hits.map((h) => (
                <button
                  key={h.id}
                  onClick={() => go(g.module)}
                  className="flex items-center justify-between rounded-lg border p-2.5 text-left transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{h.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{h.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

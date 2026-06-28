"use client";

import * as React from "react";
import { Plus, X, Search, Clock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Zone {
  city: string;
  zone: string;
}

const keyFor = (userId: string) => `dailyos-worldclock:${userId}`;

const FALLBACK_ZONES = [
  "Europe/London",
  "Europe/Paris",
  "Europe/Geneva",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Australia/Sydney",
  "Europe/Moscow",
  "America/Sao_Paulo",
  "Africa/Johannesburg",
];

function cityFromZone(zone: string): string {
  return zone.split("/").pop()!.replace(/_/g, " ");
}

function allZones(): Zone[] {
  let zones: string[] = [];
  try {
    const sv = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] })
      .supportedValuesOf;
    zones = sv ? sv("timeZone") : [];
  } catch {
    zones = [];
  }
  if (!zones.length) zones = FALLBACK_ZONES;
  return zones.map((z) => ({ zone: z, city: cityFromZone(z) }));
}

function timeParts(zone: string, now: Date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? "0", 10);
  return { h: get("hour") % 24, m: get("minute"), s: get("second") };
}

function dateLabel(zone: string, now: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(now);
}

export function WorldClock({ userId }: { userId: string }) {
  const key = keyFor(userId);
  const [cities, setCities] = React.useState<Zone[] | null>(null);
  const [query, setQuery] = React.useState("");
  const [, setTick] = React.useState(0);

  const zones = React.useMemo(() => allZones(), []);

  // Load saved cities (seed a few classics on first ever visit).
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        setCities(JSON.parse(raw) as Zone[]);
      } else {
        const seed = ["Europe/London", "America/New_York", "Asia/Tokyo"].map((z) => ({
          zone: z,
          city: cityFromZone(z),
        }));
        setCities(seed);
        localStorage.setItem(key, JSON.stringify(seed));
      }
    } catch {
      setCities([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick every second.
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  function persist(next: Zone[]) {
    setCities(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  const matches = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return zones
      .filter((z) => z.city.toLowerCase().includes(q) || z.zone.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, zones]);

  function add(z: Zone) {
    if (!cities) return;
    if (!cities.some((c) => c.zone === z.zone)) persist([...cities, z]);
    setQuery("");
  }
  function remove(zone: string) {
    if (!cities) return;
    persist(cities.filter((c) => c.zone !== zone));
  }

  const now = new Date();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="World Clock"
        description="Type a city to add it — each one shows the time on an elegant luxury-style watch."
      />

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && matches[0] && add(matches[0])}
            placeholder="Add a city — London, Tokyo, New York…"
            className="pl-9"
          />
        </div>
        {matches.length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border bg-card shadow-elevated">
            {matches.map((z) => (
              <button
                key={z.zone}
                onClick={() => add(z)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
              >
                <Plus className="size-3.5 text-muted-foreground" />
                <span className="font-medium">{z.city}</span>
                <span className="truncate text-xs text-muted-foreground">{z.zone}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {cities === null ? null : cities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <Clock className="size-6 text-primary" />
            Add a city above to see its time on a Patek-style watch.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {cities.map((c) => {
            const { h, m, s } = timeParts(c.zone, now);
            return (
              <div key={c.zone} className="group relative flex flex-col items-center gap-2">
                <button
                  onClick={() => remove(c.zone)}
                  className="absolute right-1 top-1 z-10 grid size-6 place-items-center rounded-full bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                  aria-label={`Remove ${c.city}`}
                >
                  <X className="size-3.5" />
                </button>
                <PatekWatch h={h} m={m} s={s} />
                <div className="text-center">
                  <p className="text-sm font-semibold">{c.city}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:
                    {String(s).padStart(2, "0")}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">
                    {dateLabel(c.zone, now)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** A Patek-Philippe-Nautilus-inspired analogue watch. */
function PatekWatch({ h, m, s }: { h: number; m: number; s: number }) {
  const secAngle = s * 6;
  const minAngle = m * 6 + s * 0.1;
  const hourAngle = (h % 12) * 30 + m * 0.5;

  // Chamfered-rectangle (rounded octagon) bezel — the Nautilus silhouette.
  const w = 72, hh = 74, c = 22, cx = 100, cy = 100;
  const oct = [
    [cx - (w - c), cy - hh],
    [cx + (w - c), cy - hh],
    [cx + w, cy - (hh - c)],
    [cx + w, cy + (hh - c)],
    [cx + (w - c), cy + hh],
    [cx - (w - c), cy + hh],
    [cx - w, cy + (hh - c)],
    [cx - w, cy - (hh - c)],
  ]
    .map((p) => p.join(","))
    .join(" ");

  const markers = Array.from({ length: 12 }, (_, i) => i * 30);
  const grooves = Array.from({ length: 11 }, (_, i) => 44 + i * 11);

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[150px] drop-shadow-md">
      <defs>
        <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8eaed" />
          <stop offset="0.5" stopColor="#aeb4ba" />
          <stop offset="1" stopColor="#7c828a" />
        </linearGradient>
        <radialGradient id="dial" cx="0.5" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#3b6ea5" />
          <stop offset="0.6" stopColor="#1c3f6e" />
          <stop offset="1" stopColor="#0e2444" />
        </radialGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e7b6" />
          <stop offset="1" stopColor="#c8a24a" />
        </linearGradient>
        <clipPath id="dialClip">
          <circle cx="100" cy="100" r="60" />
        </clipPath>
      </defs>

      {/* Side ears (hinges) */}
      <rect x="14" y="90" width="20" height="20" rx="6" fill="url(#steel)" />
      <rect x="166" y="90" width="20" height="20" rx="6" fill="url(#steel)" />

      {/* Case + bezel */}
      <polygon points={oct} fill="url(#steel)" stroke="#5e636b" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon
        points={oct}
        fill="none"
        stroke="#f2f4f6"
        strokeWidth="1"
        strokeLinejoin="round"
        transform="scale(0.93)"
        style={{ transformOrigin: "100px 100px" }}
      />

      {/* Dial */}
      <circle cx="100" cy="100" r="62" fill="#11233f" />
      <circle cx="100" cy="100" r="60" fill="url(#dial)" />

      {/* Horizontal grooves (Nautilus dial texture) */}
      <g clipPath="url(#dialClip)" stroke="#0c1e3a" strokeWidth="1.4" opacity="0.55">
        {grooves.map((y) => (
          <line key={y} x1="38" y1={y} x2="162" y2={y} />
        ))}
      </g>

      {/* Brand text — our own (no real trademarks) */}
      <text x="100" y="78" textAnchor="middle" fill="#e9d9a7" fontSize="7.5" letterSpacing="1" fontFamily="Georgia, serif">
        DAILYOS
      </text>
      <text x="100" y="132" textAnchor="middle" fill="#cdd6e4" fontSize="6" letterSpacing="1.2" fontFamily="Georgia, serif">
        AUTOMATIC
      </text>

      {/* Hour markers (applied batons) */}
      {markers.map((a) => (
        <rect
          key={a}
          x="98.6"
          y="46"
          width="2.8"
          height={a % 90 === 0 ? 11 : 8}
          rx="1.2"
          fill="#e9d9a7"
          transform={`rotate(${a} 100 100)`}
        />
      ))}

      {/* Hands */}
      <rect x="98.4" y="58" width="3.2" height="46" rx="1.6" fill="#eef2f7" transform={`rotate(${hourAngle} 100 100)`} />
      <rect x="99" y="44" width="2" height="60" rx="1" fill="#eef2f7" transform={`rotate(${minAngle} 100 100)`} />
      <line x1="100" y1="112" x2="100" y2="42" stroke="#e9d9a7" strokeWidth="1" transform={`rotate(${secAngle} 100 100)`} />
      <circle cx="100" cy="100" r="3.4" fill="#e9d9a7" />
      <circle cx="100" cy="100" r="1.4" fill="#1c3f6e" />
    </svg>
  );
}

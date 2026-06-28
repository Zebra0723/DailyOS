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
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="World Clock"
        description="Keeping calls, family and travel straight across time zones is its own little life-admin chore — so DailyOS handles it. Add any city and see its time at a glance (on a watch we made beautiful on purpose)."
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
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          {cities.map((c) => {
            const { h, m, s } = timeParts(c.zone, now);
            const dayNum = new Intl.DateTimeFormat("en-GB", {
              timeZone: c.zone,
              day: "numeric",
            }).format(now);
            return (
              <div key={c.zone} className="group relative flex flex-col items-center gap-2">
                <button
                  onClick={() => remove(c.zone)}
                  className="absolute right-1 top-1 z-10 grid size-6 place-items-center rounded-full bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                  aria-label={`Remove ${c.city}`}
                >
                  <X className="size-3.5" />
                </button>
                <PatekWatch h={h} m={m} s={s} city={c.city} dateNum={dayNum} />
                <div className="text-center">
                  <p className="text-base font-semibold">{c.city}</p>
                  <p className="font-mono text-sm text-muted-foreground">
                    {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:
                    {String(s).padStart(2, "0")}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
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

/** An Aquanaut-inspired analogue watch (embossed grid dial, applied numerals). */
function PatekWatch({
  h,
  m,
  s,
  city,
  dateNum,
}: {
  h: number;
  m: number;
  s: number;
  city: string;
  dateNum: string;
}) {
  const secAngle = s * 6;
  const minAngle = m * 6 + s * 0.1;
  const hourAngle = (h % 12) * 30 + m * 0.5;

  const cx = 100, cy = 100;
  // Rounded cushion-octagon case (the Aquanaut silhouette).
  const w = 76, hh = 78, c = 18;
  const octPts = (sx: number) => {
    const W = w * sx, H = hh * sx, C = c * sx;
    return [
      [cx - (W - C), cy - H],
      [cx + (W - C), cy - H],
      [cx + W, cy - (H - C)],
      [cx + W, cy + (H - C)],
      [cx + (W - C), cy + H],
      [cx - (W - C), cy + H],
      [cx - W, cy + (H - C)],
      [cx - W, cy - (H - C)],
    ]
      .map((p) => p.join(","))
      .join(" ");
  };

  const nums = [12, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11]; // 3 omitted for the date
  const markers = Array.from({ length: 12 }, (_, i) => i * 30);
  const grid = Array.from({ length: 9 }, (_, i) => 44 + i * 14);

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[320px] drop-shadow-xl">
      <defs>
        <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef0f2" />
          <stop offset="0.5" stopColor="#b4bac0" />
          <stop offset="1" stopColor="#80868e" />
        </linearGradient>
        <radialGradient id="dial" cx="0.5" cy="0.42" r="0.8">
          <stop offset="0" stopColor="#3f72ad" />
          <stop offset="0.55" stopColor="#1f4880" />
          <stop offset="1" stopColor="#0c2247" />
        </radialGradient>
        <clipPath id="dialClip">
          <circle cx="100" cy="100" r="59" />
        </clipPath>
      </defs>

      {/* Strap lugs (top & bottom) + crown (right) */}
      <rect x="86" y="16" width="28" height="14" rx="4" fill="url(#steel)" />
      <rect x="86" y="170" width="28" height="14" rx="4" fill="url(#steel)" />
      <rect x="176" y="94" width="10" height="12" rx="2" fill="url(#steel)" stroke="#6b7178" strokeWidth="0.5" />

      {/* Case + brushed bezel */}
      <polygon points={octPts(1)} fill="url(#steel)" stroke="#5e636b" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points={octPts(0.9)} fill="#0c2247" stroke="#eef0f2" strokeWidth="0.8" strokeLinejoin="round" />

      {/* Dial */}
      <circle cx="100" cy="100" r="59" fill="url(#dial)" />

      {/* Embossed grid texture (Aquanaut "tropical" pattern) */}
      <g clipPath="url(#dialClip)">
        <g stroke="#0c2143" strokeWidth="1.3" opacity="0.55">
          {grid.map((p) => (
            <line key={`v${p}`} x1={p} y1="40" x2={p} y2="160" />
          ))}
          {grid.map((p) => (
            <line key={`h${p}`} x1="40" y1={p} x2="160" y2={p} />
          ))}
        </g>
        <g stroke="#5688c4" strokeWidth="0.6" opacity="0.4">
          {grid.map((p) => (
            <line key={`vh${p}`} x1={p + 1} y1="40" x2={p + 1} y2="160" />
          ))}
          {grid.map((p) => (
            <line key={`hh${p}`} x1="40" y1={p + 1} x2="160" y2={p + 1} />
          ))}
        </g>
      </g>

      {/* Outer luminous baton markers */}
      {markers.map((a) => (
        <rect
          key={a}
          x="98.8"
          y="44"
          width="2.4"
          height="6"
          rx="1"
          fill="#e7eef6"
          transform={`rotate(${a} 100 100)`}
        />
      ))}

      {/* Applied Arabic numerals */}
      {nums.map((n) => {
        const a = (n * 30 * Math.PI) / 180;
        const r = 41;
        return (
          <text
            key={n}
            x={cx + r * Math.sin(a)}
            y={cy - r * Math.cos(a)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="9.5"
            fontWeight="700"
            fontFamily="'Arial Rounded MT Bold', Arial, sans-serif"
            fill="#e7eef6"
          >
            {n}
          </text>
        );
      })}

      {/* Date window at 3 o'clock */}
      <rect x="130" y="93" width="15" height="14" rx="1.5" fill="#f3f5f8" stroke="#9aa0a6" strokeWidth="0.5" />
      <text x="137.5" y="100.5" textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="700" fill="#1b3a66">
        {dateNum}
      </text>

      {/* Brand + city */}
      <text x="100" y="76" textAnchor="middle" fill="#eef3f9" fontSize="8" letterSpacing="0.4" fontWeight="700" fontFamily="Georgia, serif">
        DailyOS
      </text>
      <text x="100" y="86" textAnchor="middle" fill="#c6d2e2" fontSize="6" letterSpacing="0.6" fontFamily="Georgia, serif">
        {city}
      </text>

      {/* Hands */}
      <rect x="98.2" y="60" width="3.6" height="44" rx="1.8" fill="#f3f7fb" stroke="#9fb4cc" strokeWidth="0.4" transform={`rotate(${hourAngle} 100 100)`} />
      <rect x="98.8" y="46" width="2.4" height="58" rx="1.2" fill="#f3f7fb" stroke="#9fb4cc" strokeWidth="0.4" transform={`rotate(${minAngle} 100 100)`} />
      <line x1="100" y1="114" x2="100" y2="46" stroke="#e7eef6" strokeWidth="0.9" transform={`rotate(${secAngle} 100 100)`} />
      <circle cx="100" cy="100" r="3" fill="#e7eef6" />
      <circle cx="100" cy="100" r="1.2" fill="#1f4880" />
    </svg>
  );
}

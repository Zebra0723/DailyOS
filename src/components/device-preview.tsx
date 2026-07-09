"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MonitorSmartphone, Columns2 } from "lucide-react";

// Real device viewport sizes (CSS pixels).
const DEVICES = [
  { name: "iPhone 15", w: 393, h: 852 },
  { name: "iPhone SE", w: 375, h: 667 },
  { name: "iPhone 15 Pro Max", w: 430, h: 932 },
  { name: "Android (Pixel 8)", w: 412, h: 915 },
  { name: "iPad", w: 820, h: 1180 },
  { name: "iPad Pro", w: 1024, h: 1366 },
  { name: "Desktop", w: 1280, h: 800 },
  { name: "Large desktop", w: 1536, h: 900 },
];

// Real routes to preview (never /admin — that would recurse).
const ROUTES = [
  "/today",
  "/assistant",
  "/inbox",
  "/inbox/new",
  "/build-day",
  "/interests",
  "/world-clock",
  "/notes",
  "/calendar",
  "/tasks",
  "/vault",
  "/homeos",
  "/settings",
];

function Frame({
  device,
  route,
  avail,
}: {
  device: (typeof DEVICES)[number];
  route: string;
  avail: number;
}) {
  const scale = Math.min(1, avail / device.w);
  const frameW = Math.round(device.w * scale);
  const frameH = Math.round(device.h * scale);
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        style={{ width: frameW, height: frameH }}
        className="overflow-hidden rounded-2xl border-2 border-foreground/70 bg-background shadow-elevated"
      >
        <iframe
          key={`${device.name}-${route}`}
          src={route}
          title={`${device.name} preview`}
          style={{
            width: device.w,
            height: device.h,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {device.name} · {device.w}×{device.h} · {Math.round(scale * 100)}%
      </p>
    </div>
  );
}

export function DevicePreview() {
  const [di, setDi] = React.useState(0);
  const [di2, setDi2] = React.useState(6); // Desktop
  const [route, setRoute] = React.useState("/today");
  const [compare, setCompare] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [maxW, setMaxW] = React.useState(320);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setMaxW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const avail = compare ? Math.max(120, (maxW - 16) / 2) : maxW;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MonitorSmartphone className="size-4 text-primary" /> Device preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={String(di)}
            onChange={(e) => setDi(Number(e.target.value))}
            aria-label="Device"
            className="w-auto"
          >
            {DEVICES.map((d, i) => (
              <option key={d.name} value={i}>
                {d.name} · {d.w}×{d.h}
              </option>
            ))}
          </Select>
          {compare && (
            <Select
              value={String(di2)}
              onChange={(e) => setDi2(Number(e.target.value))}
              aria-label="Second device"
              className="w-auto"
            >
              {DEVICES.map((d, i) => (
                <option key={d.name} value={i}>
                  {d.name} · {d.w}×{d.h}
                </option>
              ))}
            </Select>
          )}
          <Select
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            aria-label="Page"
            className="w-auto"
          >
            {ROUTES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <Button
            variant={compare ? "default" : "outline"}
            size="sm"
            onClick={() => setCompare((c) => !c)}
          >
            <Columns2 className="size-4" /> Compare
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The <strong>real app</strong> rendered at each device&rsquo;s exact
          viewport — same code, logged in as you, scaled to fit. Not a mockup.
        </p>

        <div ref={containerRef} className="overflow-x-auto">
          <div className="flex flex-wrap items-start justify-center gap-4">
            <Frame device={DEVICES[di]} route={route} avail={avail} />
            {compare && <Frame device={DEVICES[di2]} route={route} avail={avail} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

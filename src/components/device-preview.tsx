"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { MonitorSmartphone } from "lucide-react";

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
  "/mindfulness",
  "/mood",
  "/nudges",
  "/settings",
];

export function DevicePreview() {
  const [di, setDi] = React.useState(0);
  const [route, setRoute] = React.useState("/today");
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

  const device = DEVICES[di];
  // Scale so the device's true width fits the panel; never upscale past 1.
  const scale = Math.min(1, maxW / device.w);
  const frameW = Math.round(device.w * scale);
  const frameH = Math.round(device.h * scale);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MonitorSmartphone className="size-4 text-primary" /> Device preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
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
        </div>
        <p className="text-xs text-muted-foreground">
          This is the <strong>real app</strong> rendered at each device&rsquo;s
          exact viewport — the same code, logged in as you, scaled to fit. Not a
          mockup.
        </p>

        <div ref={containerRef} className="overflow-x-auto">
          <div
            style={{ width: frameW, height: frameH }}
            className="mx-auto overflow-hidden rounded-2xl border-2 border-foreground/70 bg-background shadow-elevated"
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
        </div>
        <p className="text-center text-[11px] text-muted-foreground">
          Showing {route} at {device.name} ({device.w}×{device.h}px), scaled to{" "}
          {Math.round(scale * 100)}%.
        </p>
      </CardContent>
    </Card>
  );
}

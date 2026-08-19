"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Tablet,
  Monitor,
  RotateCw,
  ExternalLink,
} from "lucide-react";

const DEVICES = [
  { name: "iPhone SE", w: 375, h: 667, icon: Smartphone },
  { name: "iPhone 14", w: 390, h: 844, icon: Smartphone },
  { name: "iPhone 14 Pro Max", w: 430, h: 932, icon: Smartphone },
  { name: "Pixel 7", w: 412, h: 915, icon: Smartphone },
  { name: "Samsung Galaxy S23", w: 360, h: 780, icon: Smartphone },
  { name: "iPad Mini", w: 768, h: 1024, icon: Tablet },
  { name: "iPad Air", w: 820, h: 1180, icon: Tablet },
  { name: "iPad Pro 12.9", w: 1024, h: 1366, icon: Tablet },
  { name: "Laptop", w: 1366, h: 768, icon: Monitor },
  { name: "Desktop", w: 1920, h: 1080, icon: Monitor },
];

type Device = (typeof DEVICES)[number];

const PAGES = [
  { label: "Today", path: "/today" },
  { label: "Settings", path: "/settings" },
  { label: "Tasks", path: "/tasks" },
  { label: "Notes", path: "/notes" },
  { label: "Calendar", path: "/calendar" },
  { label: "Drop", path: "/inbox" },
  { label: "Vault", path: "/vault" },
  { label: "Subscriptions", path: "/subscriptions" },
  { label: "Admin", path: "/admin" },
];

export default function DevicesPage() {
  const [selected, setSelected] = useState<Device>(DEVICES[1]);
  const [rotated, setRotated] = useState(false);
  const [path, setPath] = useState("/today");
  const [customPath, setCustomPath] = useState("");
  const [scale, setScale] = useState(0.7);

  const frameW = rotated ? selected.h : selected.w;
  const frameH = rotated ? selected.w : selected.h;

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Smartphone className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Device Preview</h2>
      </div>

      {/* Device picker */}
      <div className="flex flex-wrap gap-1.5">
        {DEVICES.map((d) => {
          const Icon = d.icon;
          return (
            <Button
              key={d.name}
              variant={selected.name === d.name ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelected(d);
                setRotated(false);
              }}
              className="gap-1.5 text-xs"
            >
              <Icon className="h-3.5 w-3.5" />
              {d.name}
            </Button>
          );
        })}
      </div>

      {/* Page picker */}
      <div className="flex flex-wrap gap-1.5">
        {PAGES.map((p) => (
          <Button
            key={p.path}
            variant={path === p.path ? "default" : "outline"}
            size="sm"
            onClick={() => setPath(p.path)}
            className="text-xs"
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Custom path + controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-1.5" style={{ minWidth: 200 }}>
          <Input
            placeholder="/custom-path"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter" && customPath.trim()) {
                setPath(customPath.trim());
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={!customPath.trim()}
            onClick={() => setPath(customPath.trim())}
          >
            Go
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setRotated((r) => !r)}
          className="gap-1.5"
        >
          <RotateCw className="h-3.5 w-3.5" />
          {rotated ? "Portrait" : "Landscape"}
        </Button>

        <div className="flex items-center gap-1.5">
          {[0.5, 0.7, 0.85, 1].map((s) => (
            <Button
              key={s}
              variant={scale === s ? "default" : "outline"}
              size="sm"
              onClick={() => setScale(s)}
              className="text-xs"
            >
              {Math.round(s * 100)}%
            </Button>
          ))}
        </div>

        <a
          href={`${origin}${path}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Open <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Device info */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="tabular-nums text-xs">
          {frameW} x {frameH}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {selected.name}{rotated ? " (landscape)" : ""} — viewing{" "}
          <span className="font-medium text-foreground">{path}</span>
        </span>
      </div>

      {/* Preview frame */}
      <Card className="overflow-hidden rounded-xl">
        <CardContent className="flex justify-center bg-muted/30 p-6">
          <div
            className="overflow-hidden rounded-2xl border-4 border-foreground/20 bg-background shadow-2xl"
            style={{
              width: frameW * scale,
              height: frameH * scale,
            }}
          >
            <iframe
              src={path}
              title={`${selected.name} preview`}
              style={{
                width: frameW,
                height: frameH,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                border: "none",
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

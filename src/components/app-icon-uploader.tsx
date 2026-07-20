"use client";

import * as React from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { loadRemote, saveRemote } from "@/lib/sync";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

// Default DailyOS app icon — red disc, white brand glyph.
function DefaultIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="12" fill="#D62828" />
      <g
        transform="translate(12 12)"
        fill="none"
        stroke="#fffdf9"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
        <path d="M8.5 12.2l2.4 2.4 4.6-5.4" strokeWidth="2.4" />
      </g>
    </svg>
  );
}

/** Resize/crop an image file to a square data URL (kept small for fast sync). */
function toSquareDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    // Never hang forever if the browser can't decode the file (e.g. HEIC).
    const timer = setTimeout(() => {
      URL.revokeObjectURL(url);
      reject(new Error("timeout"));
    }, 15000);
    img.onload = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        const scale = Math.max(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}

export function AppIconUploader() {
  const { toast } = useToast();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [src, setSrc] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    void (async () => {
      const remote = await loadRemote<string>("appicon");
      if (alive && remote) setSrc(remote);
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setBusy(true);
    let dataUrl: string;
    try {
      dataUrl = await toSquareDataUrl(file);
    } catch {
      setBusy(false);
      toast({ variant: "error", title: "Couldn't use that image" });
      return;
    }
    // Show it and stop the spinner immediately — don't block the UI on the save.
    setSrc(dataUrl);
    setBusy(false);
    void saveRemote("appicon", dataUrl)
      .then(() =>
        toast({
          variant: "success",
          title: "App icon saved",
          description: "Re-add DailyOS to your home screen to see it.",
        }),
      )
      .catch(() =>
        toast({ variant: "error", title: "Saved on this device only" }),
      );
  }

  function remove() {
    setSrc(null);
    void saveRemote("appicon", "");
    toast({ variant: "info", title: "Back to the default icon" });
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative size-16 shrink-0">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Your app icon" className="size-16 rounded-2xl object-cover" />
          ) : (
            <DefaultIcon className="size-16 rounded-2xl" />
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Change app icon"
            className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
          </button>
          {src && !busy && (
            <button
              type="button"
              onClick={remove}
              aria-label="Remove custom icon"
              className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full border-2 border-background bg-muted text-muted-foreground shadow hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Home-screen icon</p>
          <p className="text-xs text-muted-foreground">
            Use your own image, or keep the DailyOS icon.
          </p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
              Choose image
            </Button>
            {src && (
              <Button size="sm" variant="ghost" onClick={remove} disabled={busy}>
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>
      <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        Your device caches the icon when you install. To update it, remove
        DailyOS from your home screen and add it again.
      </p>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
    </div>
  );
}

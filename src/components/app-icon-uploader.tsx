"use client";

import * as React from "react";
import { Camera, Loader2, Lock } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APPICON_LS_KEY, APPICON_EVENT } from "@/components/app-icon-link";

// Enter this code to unlock setting a custom home-screen icon for this device.
const ICON_CODE = "ADMINICONOS";

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

/** Resize/crop an image file to a small square data URL. */
function toSquareDataUrl(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
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
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const unlocked = code.trim() === ICON_CODE;

  React.useEffect(() => {
    try {
      setSrc(localStorage.getItem(APPICON_LS_KEY));
    } catch {
      /* ignore */
    }
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file || !unlocked) return;
    setBusy(true);
    let dataUrl: string;
    try {
      dataUrl = await toSquareDataUrl(file);
    } catch {
      setBusy(false);
      toast({ variant: "error", title: "Couldn't use that image" });
      return;
    }
    setSrc(dataUrl);
    setBusy(false);
    try {
      localStorage.setItem(APPICON_LS_KEY, dataUrl);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(APPICON_EVENT, { detail: dataUrl }));
    toast({
      variant: "success",
      title: "Icon set for this device",
      description: "Remove DailyOS from your home screen and add it again.",
    });
  }

  function reset() {
    setSrc(null);
    try {
      localStorage.removeItem(APPICON_LS_KEY);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(APPICON_EVENT, { detail: null }));
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
          {busy && (
            <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/40">
              <Loader2 className="size-5 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Home-screen icon</p>
          <p className="text-xs text-muted-foreground">
            Set a custom icon for this device. Enter the code to unlock.
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Icon code"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={!unlocked || busy}
          >
            <Camera className="size-4" /> Choose image
          </Button>
          {src && (
            <Button size="sm" variant="ghost" onClick={reset} disabled={busy}>
              Reset
            </Button>
          )}
        </div>
      </div>

      <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        This only changes the icon on this device. Your phone caches the icon
        when you install, so remove DailyOS from the home screen and add it again
        to see the change.
      </p>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
    </div>
  );
}

"use client";

import * as React from "react";
import { Undo2 } from "lucide-react";

const RETRO_KEY = "dailyos-retro-mode";

const RetroCtx = React.createContext({
  active: false,
  toggle: () => {},
});

export function useRetroMode() {
  return React.useContext(RetroCtx);
}

const RETRO_CSS = `
[data-retro] {
  --background: 0 0% 4% !important;
  --foreground: 120 100% 56% !important;
  --card: 0 0% 7% !important;
  --card-foreground: 120 100% 56% !important;
  --popover: 0 0% 7% !important;
  --popover-foreground: 120 100% 56% !important;
  --primary: 120 100% 56% !important;
  --primary-foreground: 0 0% 0% !important;
  --secondary: 0 0% 12% !important;
  --secondary-foreground: 120 100% 56% !important;
  --muted: 0 0% 10% !important;
  --muted-foreground: 120 60% 40% !important;
  --accent: 0 0% 12% !important;
  --accent-foreground: 120 100% 56% !important;
  --destructive: 0 80% 50% !important;
  --destructive-foreground: 0 0% 100% !important;
  --border: 120 60% 20% !important;
  --input: 120 60% 20% !important;
  --ring: 120 100% 56% !important;
  --radius: 0px !important;
  font-family: "Courier New", Courier, monospace !important;
}
[data-retro] * {
  font-family: inherit !important;
  border-radius: 0 !important;
}
[data-retro] .rounded-full {
  border-radius: 0 !important;
}
[data-retro] img,
[data-retro] svg:not(.retro-keep) {
  filter: hue-rotate(80deg) saturate(3) brightness(0.8);
}
[data-retro] ::selection {
  background: hsl(120 100% 56% / 0.3);
  color: hsl(120 100% 80%);
}
[data-retro] input,
[data-retro] textarea {
  caret-color: hsl(120 100% 56%);
}
@keyframes retro-scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}
`;

export function RetroModeProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem(RETRO_KEY);
    if (stored === "1") {
      setActive(true);
      document.documentElement.setAttribute("data-retro", "");
    }
  }, []);

  const toggle = React.useCallback(() => {
    setActive((prev) => {
      const next = !prev;
      if (next) {
        localStorage.setItem(RETRO_KEY, "1");
        document.documentElement.setAttribute("data-retro", "");
      } else {
        localStorage.removeItem(RETRO_KEY);
        document.documentElement.removeAttribute("data-retro");
      }
      return next;
    });
  }, []);

  return (
    <RetroCtx.Provider value={{ active, toggle }}>
      {active && <style dangerouslySetInnerHTML={{ __html: RETRO_CSS }} />}
      {children}
      {active && <RetroFloatingButton onExit={toggle} />}
    </RetroCtx.Provider>
  );
}

function RetroFloatingButton({ onExit }: { onExit: () => void }) {
  return (
    <button
      onClick={onExit}
      className="fixed bottom-20 right-4 z-[9999] flex items-center gap-2 border px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-lg transition-opacity hover:opacity-80 md:bottom-6"
      style={{
        background: "#0a0a0a",
        color: "#00ff41",
        borderColor: "#00ff41",
        fontFamily: '"Courier New", Courier, monospace',
        borderRadius: 0,
      }}
    >
      <Undo2 className="retro-keep size-3.5" style={{ filter: "none" }} />
      Back to {new Date().getFullYear()}
    </button>
  );
}

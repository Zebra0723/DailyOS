"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { loadRemote, saveRemote } from "@/lib/sync";
import { LOCALES, type LocaleDef } from "@/lib/locale";
import { Select } from "@/components/ui/select";

type Prefs = {
  dailyBrief?: boolean;
  locale?: string;
};

export function LanguagePicker() {
  const [locale, setLocale] = React.useState<string>("en-GB");
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    loadRemote<Prefs>("prefs").then((prefs) => {
      if (prefs?.locale) setLocale(prefs.locale);
      setLoaded(true);
    });
  }, []);

  async function handleChange(code: string) {
    setLocale(code);
    const prefs = (await loadRemote<Prefs>("prefs")) ?? {};
    await saveRemote("prefs", { ...prefs, locale: code });
  }

  if (!loaded) return null;

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div className="inline-flex items-center gap-1.5">
      <Globe className="size-3.5 text-muted-foreground" />
      <Select
        value={locale}
        onChange={(e) => handleChange(e.target.value)}
        className="h-7 w-auto border-0 bg-transparent py-0 pl-1 pr-7 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground shadow-none focus-visible:ring-0"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

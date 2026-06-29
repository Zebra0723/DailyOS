"use client";

import * as React from "react";
import {
  Plus,
  X,
  ShoppingCart,
  Store,
  MapPin,
  Check,
  Loader2,
} from "lucide-react";
import { getShop } from "@/app/(app)/shopping/actions";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ShopItem {
  id: string;
  name: string;
  shop: string;
  bought: boolean;
}

interface Stored {
  city: string;
  items: ShopItem[];
}

const keyFor = (userId: string) => `dailyos-shopping:${userId}`;

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
}

function mapsUrl(item: string, city: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${item}${city ? ` near ${city}` : ""}`,
  )}`;
}

export function ShoppingList({ userId }: { userId: string }) {
  const key = keyFor(userId);
  const [city, setCity] = React.useState("");
  const [items, setItems] = React.useState<ShopItem[] | null>(null);
  const [draft, setDraft] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Stored;
        setCity(parsed.city ?? "");
        setItems(Array.isArray(parsed.items) ? parsed.items : []);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(nextCity: string, nextItems: ShopItem[]) {
    try {
      localStorage.setItem(key, JSON.stringify({ city: nextCity, items: nextItems }));
    } catch {
      /* ignore */
    }
  }

  function onCity(v: string) {
    setCity(v);
    persist(v, items ?? []);
  }

  async function add() {
    const name = draft.trim();
    if (!name || !items) return;
    if (!city.trim()) {
      setError("Add your city first so I can find shops near you.");
      return;
    }
    setError(null);
    setAdding(true);
    try {
      const res = await getShop(name, city);
      const shop = res.ok ? res.suggestion.shop : "a local shop nearby";
      const next = [{ id: uid(), name, shop, bought: false }, ...items];
      setItems(next);
      persist(city, next);
      setDraft("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  function toggle(id: string) {
    if (!items) return;
    const next = items.map((i) => (i.id === id ? { ...i, bought: !i.bought } : i));
    setItems(next);
    persist(city, next);
  }
  function remove(id: string) {
    if (!items) return;
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    persist(city, next);
  }

  const toBuy = (items ?? []).filter((i) => !i.bought);
  const bought = (items ?? []).filter((i) => i.bought);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Shopping List"
        description="Jot what you want to buy. DailyOS suggests where to get it and a map of shops near you — all on one list."
      />

      {/* City */}
      <Card className="mb-4">
        <CardContent className="flex items-center gap-2 pt-5">
          <MapPin className="size-4 shrink-0 text-muted-foreground" />
          <Input
            value={city}
            onChange={(e) => onCity(e.target.value)}
            placeholder="Your city — e.g. London"
            className="border-0 p-0 shadow-none focus-visible:ring-0"
          />
        </CardContent>
      </Card>

      {/* Add item */}
      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Something to buy — e.g. tennis racket"
            />
            <Button onClick={add} disabled={adding || !draft.trim()}>
              {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add
            </Button>
          </div>
          {error && (
            <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {items === null ? (
        <div className="grid place-items-center py-12 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <ShoppingCart className="size-6 text-primary" />
            Your shopping list is empty. Add something you need to buy.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {toBuy.map((it) => (
            <ItemRow key={it.id} it={it} city={city} onToggle={toggle} onRemove={remove} />
          ))}

          {bought.length > 0 && (
            <p className="px-1 pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Got it
            </p>
          )}
          {bought.map((it) => (
            <ItemRow key={it.id} it={it} city={city} onToggle={toggle} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemRow({
  it,
  city,
  onToggle,
  onRemove,
}: {
  it: ShopItem;
  city: string;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3.5">
        <button
          onClick={() => onToggle(it.id)}
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
            it.bought ? "border-emerald-500 bg-emerald-500 text-white" : "border-input hover:border-primary",
          )}
          aria-label={it.bought ? "Mark to buy" : "Mark bought"}
        >
          {it.bought && <Check className="size-3.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-medium", it.bought && "line-through opacity-60")}>
            {it.name}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Store className="size-3.5" /> {it.shop}
          </p>
        </div>
        <a
          href={mapsUrl(it.name, city)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
        >
          <MapPin className="size-3.5" /> Nearby
        </a>
        <button
          onClick={() => onRemove(it.id)}
          className="grid size-8 shrink-0 place-items-center text-muted-foreground hover:text-foreground"
          aria-label="Remove"
        >
          <X className="size-4" />
        </button>
      </CardContent>
    </Card>
  );
}

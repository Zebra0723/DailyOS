"use server";

import { suggestShop, type ShopSuggestion } from "@/lib/ai/shopping";

export type ShopResponse =
  | { ok: true; suggestion: ShopSuggestion }
  | { ok: false; error: string };

export async function getShop(item: string, city: string): Promise<ShopResponse> {
  const trimmed = item.trim();
  if (trimmed.length < 2) return { ok: false, error: "Add an item to buy first." };
  try {
    const suggestion = await suggestShop(trimmed, city.trim());
    return { ok: true, suggestion };
  } catch {
    return { ok: false, error: "Couldn't suggest a shop right now. Please try again." };
  }
}

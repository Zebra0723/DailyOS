// ----------------------------------------------------------------------------
// Shopping list — suggest where to buy an item. Uses the shared LLM provider
// when configured (named retailers), with a keyword-based local fallback.
// The actual "nearby" results come from a Google Maps search link built on the
// client from the user's city, so this stays honest without a Places API.
// Server-only.
// ----------------------------------------------------------------------------

import "server-only";
import { z } from "zod";
import { getAIProvider } from "./provider";

export interface ShopSuggestion {
  shop: string;
  usedAI: boolean;
}

const Schema = z.object({ shop: z.string().default("") });

export async function suggestShop(item: string, city: string): Promise<ShopSuggestion> {
  const provider = getAIProvider();
  if (provider.isConfigured()) {
    try {
      const raw = await provider.chat({
        json: true,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "Suggest where to buy a given item. Reply as strict JSON {\"shop\": string} — one short phrase naming 1-2 well-known (UK-focused) shops or a shop type that sells it, e.g. 'Decathlon or Sports Direct'. No addresses.",
          },
          { role: "user", content: `Item: ${item}${city ? ` (city: ${city})` : ""}` },
        ],
      });
      const parsed = Schema.parse(JSON.parse(extractJson(raw)));
      if (parsed.shop.trim()) return { shop: parsed.shop.trim(), usedAI: true };
    } catch {
      /* fall through */
    }
  }
  return { shop: localShop(item), usedAI: false };
}

function extractJson(raw: string): string {
  const s = raw.indexOf("{");
  const e = raw.lastIndexOf("}");
  return s >= 0 && e > s ? raw.slice(s, e + 1) : raw;
}

function localShop(itemRaw: string): string {
  const i = itemRaw.toLowerCase();
  const has = (...w: string[]) => w.some((x) => i.includes(x));

  if (has("tennis", "football", "gym", "running", "racket", "trainers", "sport", "bike", "ball"))
    return "Decathlon or Sports Direct";
  if (has("phone", "laptop", "tv", "charger", "headphone", "cable", "console", "camera", "electronic"))
    return "Currys or Argos";
  if (has("book", "novel", "notebook", "stationery", "pen"))
    return "Waterstones or WHSmith";
  if (has("milk", "bread", "food", "grocery", "snack", "veg", "fruit", "drink"))
    return "Tesco, Sainsbury's or your local supermarket";
  if (has("shirt", "jeans", "dress", "clothes", "shoes", "jacket", "coat"))
    return "Next, M&S or Zara";
  if (has("drill", "paint", "screw", "tool", "diy", "wood", "tile"))
    return "B&Q or Screwfix";
  if (has("sofa", "table", "chair", "bed", "desk", "furniture", "lamp", "shelf"))
    return "IKEA or John Lewis";
  if (has("medicine", "vitamin", "plaster", "shampoo", "toothpaste", "pharmacy"))
    return "Boots or Superdrug";
  if (has("plant", "seed", "garden", "flower", "soil"))
    return "a garden centre or Homebase";
  if (has("toy", "game", "lego", "kids"))
    return "Smyths or The Entertainer";
  return "a local shop nearby, or search online";
}

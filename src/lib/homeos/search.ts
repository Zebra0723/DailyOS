import type { HomeModule, HomeOSData } from "./types";

export interface SearchHit {
  id: string;
  title: string;
  subtitle: string;
  module: HomeModule;
  entityType: "subscription" | "arrival" | "roomItem" | "device" | "document" | "alert";
}

export interface SearchResults {
  query: string;
  total: number;
  groups: { module: HomeModule; hits: SearchHit[] }[];
}

function match(haystack: (string | undefined | null)[], q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return false;
  return haystack.some((h) => (h ?? "").toLowerCase().includes(needle));
}

/** Search across every HomeOS module, returning results grouped by module. */
export function searchHomeOS(query: string, data: HomeOSData): SearchResults {
  const q = query.trim();
  const hits: SearchHit[] = [];

  if (q) {
    for (const s of data.subscriptions) {
      if (match([s.name, s.provider, s.category, s.status, s.owner, s.notes, ...s.tags], q))
        hits.push({
          id: s.id,
          title: s.name,
          subtitle: `${s.category} · ${s.status}`,
          module: "SubscriptionOps",
          entityType: "subscription",
        });
    }
    for (const a of data.arrivals) {
      if (match([a.title, a.company, a.type, a.status, a.roomOrLocation, a.contactName, a.notes], q))
        hits.push({
          id: a.id,
          title: a.title,
          subtitle: `${a.type} · ${a.status}`,
          module: "ArrivalOps",
          entityType: "arrival",
        });
    }
    for (const r of data.roomItems) {
      if (match([r.name, r.room, r.itemType, r.brand, r.retailer, r.status, r.notes], q))
        hits.push({
          id: r.id,
          title: r.name,
          subtitle: `${r.room} · ${r.status}`,
          module: "RoomOps",
          entityType: "roomItem",
        });
    }
    for (const d of data.devices) {
      if (match([d.name, d.room, d.type, d.brand, d.model, d.status, d.issueDescription, d.notes], q))
        hits.push({
          id: d.id,
          title: d.name,
          subtitle: `${d.room} · ${d.status}`,
          module: "DeviceOps",
          entityType: "device",
        });
    }
    for (const doc of data.documents) {
      if (match([doc.title, doc.type, doc.provider, doc.notes, ...doc.tags], q))
        hits.push({
          id: doc.id,
          title: doc.title,
          subtitle: `${doc.type}${doc.provider ? ` · ${doc.provider}` : ""}`,
          module: "Home Vault",
          entityType: "document",
        });
    }
    for (const al of data.alerts) {
      if (match([al.title, al.message, al.module, al.severity, al.status], q))
        hits.push({
          id: al.id,
          title: al.title,
          subtitle: `${al.severity} · ${al.status}`,
          module: al.module,
          entityType: "alert",
        });
    }
  }

  const moduleOrder: HomeModule[] = [
    "SubscriptionOps",
    "ArrivalOps",
    "RoomOps",
    "DeviceOps",
    "Home Vault",
    "HomeOS",
  ];
  const groups = moduleOrder
    .map((module) => ({ module, hits: hits.filter((h) => h.module === module) }))
    .filter((g) => g.hits.length > 0);

  return { query: q, total: hits.length, groups };
}

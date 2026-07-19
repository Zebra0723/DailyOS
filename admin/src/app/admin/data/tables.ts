export const DATA_TABLES = [
  "inbox_items",
  "extracted_tasks",
  "calendar_events",
  "notes",
  "vault_items",
  "push_subscriptions",
  "reward_codes",
] as const;

export type DataTable = (typeof DATA_TABLES)[number];

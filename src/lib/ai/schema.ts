import { z } from "zod";

// Zod schema used to validate the LLM's JSON output. We coerce/normalise where
// reasonable so a slightly-off response from the model still passes review.

const priority = z
  .enum(["low", "medium", "high"])
  .catch("medium");

export const itemTypeSchema = z
  .enum([
    "travel",
    "receipt",
    "warranty",
    "booking",
    "school",
    "finance",
    "health",
    "subscription",
    "event",
    "general",
  ])
  .catch("general");

export const vaultCategorySchema = z
  .enum([
    "travel",
    "home",
    "school",
    "finance",
    "purchases",
    "health",
    "subscriptions",
    "general",
  ])
  .catch("general");

const nullableString = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v == null || v === "" ? null : v));

export const keyDateSchema = z.object({
  date: z.string(),
  time: nullableString,
  description: z.string().default(""),
});

export const suggestedTaskSchema = z.object({
  title: z.string().min(1),
  description: nullableString,
  due_date: nullableString,
  priority,
});

export const suggestedEventSchema = z.object({
  title: z.string().min(1),
  description: nullableString,
  start_time: nullableString,
  end_time: nullableString,
  location: nullableString,
});

export const entitiesSchema = z
  .object({
    people: z.array(z.string()).default([]),
    companies: z.array(z.string()).default([]),
    places: z.array(z.string()).default([]),
    prices: z.array(z.string()).default([]),
    reference_numbers: z.array(z.string()).default([]),
  })
  .default({
    people: [],
    companies: [],
    places: [],
    prices: [],
    reference_numbers: [],
  });

export const extractionResultSchema = z.object({
  item_type: itemTypeSchema,
  summary: z.string().default(""),
  key_dates: z.array(keyDateSchema).default([]),
  suggested_tasks: z.array(suggestedTaskSchema).default([]),
  suggested_calendar_events: z.array(suggestedEventSchema).default([]),
  entities: entitiesSchema,
  vault_category: vaultCategorySchema,
});

export type ExtractionResultParsed = z.infer<typeof extractionResultSchema>;

// ----------------------------------------------------------------------------
// Shared domain types for DailyOS.
// These mirror the Supabase schema in supabase/schema.sql.
// ----------------------------------------------------------------------------

export type InboxStatus =
  | "pending"
  | "processing"
  | "review"
  | "approved"
  | "failed";

export type InputType = "file" | "text";

export type ItemType =
  | "travel"
  | "receipt"
  | "warranty"
  | "booking"
  | "school"
  | "finance"
  | "health"
  | "subscription"
  | "event"
  | "general";

export type VaultCategory =
  | "travel"
  | "home"
  | "school"
  | "finance"
  | "purchases"
  | "health"
  | "subscriptions"
  | "general";

export type Priority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "completed";

export interface InboxItem {
  id: string;
  user_id: string;
  title: string;
  input_type: InputType;
  original_text: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  status: InboxStatus;
  item_type: ItemType | null;
  summary: string | null;
  raw_ai_json: ExtractionResult | null;
  needs_text_extraction: boolean;
  handled: boolean;
  created_at: string;
  updated_at: string;
}

export type Recurrence = "none" | "daily" | "weekly" | "monthly";

export interface ExtractedTask {
  id: string;
  user_id: string;
  inbox_item_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
  status: TaskStatus;
  /** Optional — present only after the recurrence migration is run. */
  recurrence?: Recurrence;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  inbox_item_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface VaultItem {
  id: string;
  user_id: string;
  inbox_item_id: string;
  category: VaultCategory;
  title: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessingLog {
  id: string;
  user_id: string;
  inbox_item_id: string;
  status: string;
  message: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

/** Result of analysing a note the moment it's written. */
export interface NoteAnalysis {
  category: string;
  kind: "admin" | "wellbeing" | "note";
  // A smart reminder DailyOS offers (one tap to confirm) when the note looks
  // like life admin. null when there's nothing actionable.
  suggested_task: {
    title: string;
    due_date: string | null;
    priority: Priority;
  } | null;
  // True when the note has a stressed / grateful tone → gentle wellbeing nudge.
  wellbeing: boolean;
}

// --- AI extraction shape ----------------------------------------------------

export interface KeyDate {
  date: string;
  time: string | null;
  description: string;
}

export type Confidence = "low" | "medium" | "high";

export interface SuggestedTask {
  title: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
  reason?: string | null;
}

export interface SuggestedEvent {
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
}

export interface Entities {
  people: string[];
  companies: string[];
  places: string[];
  prices: string[];
  reference_numbers: string[];
  order_numbers: string[];
  booking_numbers: string[];
  deadlines: string[];
}

export interface WatchOut {
  title: string;
  detail: string;
}

export interface SourceSnippet {
  label: string;
  snippet: string;
}

export interface ExtractionResult {
  item_type: ItemType;
  summary: string;
  confidence: Confidence;
  main_date: string | null;
  key_dates: KeyDate[];
  suggested_tasks: SuggestedTask[];
  suggested_calendar_events: SuggestedEvent[];
  entities: Entities;
  watch_outs: WatchOut[];
  source_snippets: SourceSnippet[];
  vault_category: VaultCategory;
}

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  travel: "Travel",
  receipt: "Receipt",
  warranty: "Warranty",
  booking: "Booking",
  school: "School",
  finance: "Finance",
  health: "Health",
  subscription: "Subscription",
  event: "Event",
  general: "General",
};

export const VAULT_CATEGORY_LABELS: Record<VaultCategory, string> = {
  travel: "Travel",
  home: "Home",
  school: "School",
  finance: "Finance",
  purchases: "Purchases",
  health: "Health",
  subscriptions: "Subscriptions",
  general: "General",
};

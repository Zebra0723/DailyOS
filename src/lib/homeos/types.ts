// ============================================================================
// HomeOS — the home-management branch of DailyOS.
// Core data types. Everything is persisted to localStorage (no backend yet).
// ============================================================================

export type BillingCycle =
  | "Monthly"
  | "Annual"
  | "Weekly"
  | "Quarterly"
  | "Trial"
  | "Other";

export type SubscriptionStatus =
  | "Active"
  | "Trial"
  | "Reviewing"
  | "Cancel Soon"
  | "Cancelled"
  | "Paused";

export type SubscriptionCategory =
  | "Streaming"
  | "Utilities"
  | "Insurance"
  | "Broadband"
  | "Mobile"
  | "Software"
  | "Home Security"
  | "Family"
  | "Fitness"
  | "Other";

export type UsageLevel = "High" | "Medium" | "Low" | "Unknown";
export type Importance = "Essential" | "Useful" | "Optional" | "Unknown";

export interface HomeProfile {
  id: string;
  name: string;
  addressLabel: string;
  householdMembers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface HomeSubscription {
  id: string;
  name: string;
  provider: string;
  category: SubscriptionCategory;
  monthlyCost: number;
  annualCost: number;
  billingCycle: BillingCycle;
  renewalDate?: string;
  trialEndDate?: string;
  contractEndDate?: string;
  paymentMethod?: string;
  status: SubscriptionStatus;
  owner?: string;
  cancellationUrl?: string;
  notes?: string;
  tags: string[];
  importance: Importance;
  usageLevel: UsageLevel;
  priceIncreaseDetected: boolean;
  lastReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ArrivalType =
  | "Package"
  | "Grocery Delivery"
  | "Furniture Delivery"
  | "Tradesperson"
  | "Cleaner"
  | "Guest"
  | "Collection"
  | "Installer"
  | "Home Appointment"
  | "Other";

export type ArrivalStatus =
  | "Scheduled"
  | "In Transit"
  | "Arriving Today"
  | "Delayed"
  | "Completed"
  | "Missed"
  | "Cancelled"
  | "Needs Follow-up";

export type Priority = "Critical" | "High" | "Normal" | "Low";

export type LinkedEntityType =
  | "subscription"
  | "arrival"
  | "roomItem"
  | "device"
  | "document"
  | null;

export interface HomeArrival {
  id: string;
  title: string;
  type: ArrivalType;
  expectedDate?: string;
  expectedTimeWindow?: string;
  company?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  contactName?: string;
  contactPhone?: string;
  accessInstructions?: string;
  roomOrLocation?: string;
  status: ArrivalStatus;
  priority: Priority;
  needsSomeoneHome: boolean;
  notes?: string;
  linkedEntityType: LinkedEntityType;
  linkedEntityId?: string;
  createdAt: string;
  updatedAt: string;
}

export type Room =
  | "Living Room"
  | "Kitchen"
  | "Main Bedroom"
  | "Bedroom"
  | "Bathroom"
  | "Office"
  | "Kids Room"
  | "Hallway"
  | "Garden"
  | "Garage"
  | "Utility Room"
  | "Other";

export type RoomItemStatus =
  | "Idea"
  | "Need to Buy"
  | "Comparing"
  | "Ordered"
  | "Delivered"
  | "Assembling"
  | "Installed"
  | "Returning"
  | "Returned"
  | "Complete";

export type RoomItemPriority = "High" | "Normal" | "Low";

export interface RoomItem {
  id: string;
  name: string;
  room: Room;
  itemType?: string;
  brand?: string;
  retailer?: string;
  price?: number;
  orderDate?: string;
  deliveryDate?: string;
  returnDeadline?: string;
  warrantyEndDate?: string;
  dimensions?: string;
  colour?: string;
  status: RoomItemStatus;
  priority: RoomItemPriority;
  assemblyRequired: boolean;
  installerNeeded: boolean;
  receiptUrl?: string;
  manualUrl?: string;
  notes?: string;
  linkedArrivalId?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeviceType =
  | "Appliance"
  | "Smart Device"
  | "Light"
  | "Plug"
  | "Router"
  | "Speaker"
  | "TV"
  | "Console"
  | "Charger"
  | "Heating"
  | "Security"
  | "Other";

export type DeviceStatus =
  | "Working"
  | "Needs Setup"
  | "Issue"
  | "Needs Repair"
  | "Warranty Claim"
  | "Replace Soon"
  | "Retired";

export interface HomeDevice {
  id: string;
  name: string;
  room: Room;
  type: DeviceType;
  brand?: string;
  model?: string;
  purchaseDate?: string;
  warrantyEndDate?: string;
  powerRating?: string;
  connectedTo?: string;
  status: DeviceStatus;
  issueDescription?: string;
  troubleshootingSteps: string[];
  manualUrl?: string;
  supportUrl?: string;
  notes?: string;
  maintenanceIntervalDays?: number;
  lastCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentType =
  | "Receipt"
  | "Warranty"
  | "Manual"
  | "Contract"
  | "Insurance"
  | "Quote"
  | "Invoice"
  | "Return Label"
  | "Other";

export interface HomeDocument {
  id: string;
  title: string;
  type: DocumentType;
  linkedEntityType: LinkedEntityType;
  linkedEntityId?: string;
  provider?: string;
  date?: string;
  expiryDate?: string;
  fileUrl?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type AlertSeverity = "Critical" | "Warning" | "Info";
export type AlertStatus = "Open" | "Snoozed" | "Resolved";
export type HomeModule =
  | "SubscriptionOps"
  | "ArrivalOps"
  | "RoomOps"
  | "DeviceOps"
  | "Home Vault"
  | "HomeOS";

export interface HomeAlert {
  id: string;
  key: string; // stable dedupe key: module-entityId-alertType
  title: string;
  message: string;
  severity: AlertSeverity;
  module: HomeModule;
  linkedEntityType: LinkedEntityType;
  linkedEntityId?: string;
  dueDate?: string;
  status: AlertStatus;
  snoozedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export type TodayActionStatus = "Not Started" | "In Progress" | "Done";

export interface DailyOSTodayAction {
  id: string;
  title: string;
  source: "HomeOS" | "Life Inbox" | "Manual";
  sourceModule?: HomeModule;
  linkedEntityType: LinkedEntityType;
  linkedEntityId?: string;
  priority: Priority;
  suggestedTime?: string;
  estimatedMinutes?: number;
  status: TodayActionStatus;
  createdAt: string;
}

export interface HomeOSSettings {
  renewalWarningDays: number;
  trialWarningDays: number;
  contractWarningDays: number;
  returnWarningDays: number;
  warrantyWarningDays: number;
  maintenanceWarningDays: number;
  highMonthlySpendThreshold: number;
  alerts: {
    subscriptionRenewal: boolean;
    trial: boolean;
    contract: boolean;
    arrival: boolean;
    returnDeadline: boolean;
    warranty: boolean;
    maintenance: boolean;
    documentExpiry: boolean;
    highSpend: boolean;
  };
}

export interface HomeOSData {
  homeProfile: HomeProfile;
  subscriptions: HomeSubscription[];
  arrivals: HomeArrival[];
  roomItems: RoomItem[];
  devices: HomeDevice[];
  documents: HomeDocument[];
  alerts: HomeAlert[];
  todayActions: DailyOSTodayAction[];
  settings: HomeOSSettings;
}

// ---- Allowed-value lists (for forms / filters) -----------------------------

export const BILLING_CYCLES: BillingCycle[] = [
  "Monthly",
  "Annual",
  "Weekly",
  "Quarterly",
  "Trial",
  "Other",
];
export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "Active",
  "Trial",
  "Reviewing",
  "Cancel Soon",
  "Cancelled",
  "Paused",
];
export const SUBSCRIPTION_CATEGORIES: SubscriptionCategory[] = [
  "Streaming",
  "Utilities",
  "Insurance",
  "Broadband",
  "Mobile",
  "Software",
  "Home Security",
  "Family",
  "Fitness",
  "Other",
];
export const USAGE_LEVELS: UsageLevel[] = ["High", "Medium", "Low", "Unknown"];
export const IMPORTANCE_LEVELS: Importance[] = [
  "Essential",
  "Useful",
  "Optional",
  "Unknown",
];
export const ARRIVAL_TYPES: ArrivalType[] = [
  "Package",
  "Grocery Delivery",
  "Furniture Delivery",
  "Tradesperson",
  "Cleaner",
  "Guest",
  "Collection",
  "Installer",
  "Home Appointment",
  "Other",
];
export const ARRIVAL_STATUSES: ArrivalStatus[] = [
  "Scheduled",
  "In Transit",
  "Arriving Today",
  "Delayed",
  "Completed",
  "Missed",
  "Cancelled",
  "Needs Follow-up",
];
export const PRIORITIES: Priority[] = ["Critical", "High", "Normal", "Low"];
export const ROOMS: Room[] = [
  "Living Room",
  "Kitchen",
  "Main Bedroom",
  "Bedroom",
  "Bathroom",
  "Office",
  "Kids Room",
  "Hallway",
  "Garden",
  "Garage",
  "Utility Room",
  "Other",
];
export const ROOM_ITEM_STATUSES: RoomItemStatus[] = [
  "Idea",
  "Need to Buy",
  "Comparing",
  "Ordered",
  "Delivered",
  "Assembling",
  "Installed",
  "Returning",
  "Returned",
  "Complete",
];
export const DEVICE_TYPES: DeviceType[] = [
  "Appliance",
  "Smart Device",
  "Light",
  "Plug",
  "Router",
  "Speaker",
  "TV",
  "Console",
  "Charger",
  "Heating",
  "Security",
  "Other",
];
export const DEVICE_STATUSES: DeviceStatus[] = [
  "Working",
  "Needs Setup",
  "Issue",
  "Needs Repair",
  "Warranty Claim",
  "Replace Soon",
  "Retired",
];
export const DOCUMENT_TYPES: DocumentType[] = [
  "Receipt",
  "Warranty",
  "Manual",
  "Contract",
  "Insurance",
  "Quote",
  "Invoice",
  "Return Label",
  "Other",
];
export const HOME_MODULES: HomeModule[] = [
  "SubscriptionOps",
  "ArrivalOps",
  "RoomOps",
  "DeviceOps",
  "Home Vault",
  "HomeOS",
];

// "Complete", "in progress", "needed" buckets for room completion maths.
export const ROOM_COMPLETE_STATUSES: RoomItemStatus[] = [
  "Installed",
  "Returned",
  "Complete",
];
export const ROOM_IN_PROGRESS_STATUSES: RoomItemStatus[] = [
  "Ordered",
  "Delivered",
  "Assembling",
  "Returning",
  "Comparing",
];
export const ROOM_NEEDED_STATUSES: RoomItemStatus[] = ["Idea", "Need to Buy"];

export const DEFAULT_SETTINGS: HomeOSSettings = {
  renewalWarningDays: 30,
  trialWarningDays: 7,
  contractWarningDays: 30,
  returnWarningDays: 7,
  warrantyWarningDays: 30,
  maintenanceWarningDays: 0,
  highMonthlySpendThreshold: 150,
  alerts: {
    subscriptionRenewal: true,
    trial: true,
    contract: true,
    arrival: true,
    returnDeadline: true,
    warranty: true,
    maintenance: true,
    documentExpiry: true,
    highSpend: true,
  },
};

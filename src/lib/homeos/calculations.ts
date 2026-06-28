import {
  addDays,
  daysUntil,
  isOverdue,
  isToday,
  isWithinDays,
} from "./dates";
import {
  ROOM_COMPLETE_STATUSES,
  ROOM_IN_PROGRESS_STATUSES,
  ROOM_NEEDED_STATUSES,
  type HomeAlert,
  type HomeArrival,
  type HomeDevice,
  type HomeDocument,
  type HomeModule,
  type HomeOSData,
  type HomeSubscription,
  type Room,
  type RoomItem,
} from "./types";

/** Normalised monthly cost for a subscription, whatever its billing cycle. */
export function monthlyEquivalent(s: HomeSubscription): number {
  if (s.status === "Cancelled") return 0;
  if (s.monthlyCost && s.monthlyCost > 0) {
    switch (s.billingCycle) {
      case "Weekly":
        return s.monthlyCost * 4.345;
      case "Quarterly":
        return s.monthlyCost / 3;
      case "Annual":
        return s.monthlyCost / 12;
      default:
        return s.monthlyCost;
    }
  }
  if (s.annualCost && s.annualCost > 0) return s.annualCost / 12;
  return 0;
}

export function getMonthlySubscriptionTotal(subs: HomeSubscription[]): number {
  return round2(subs.reduce((sum, s) => sum + monthlyEquivalent(s), 0));
}

export function getAnnualSubscriptionTotal(subs: HomeSubscription[]): number {
  return round2(getMonthlySubscriptionTotal(subs) * 12);
}

/** Subscriptions that look like cancel candidates, for a rough savings figure. */
function isCancelCandidate(s: HomeSubscription): boolean {
  if (s.status === "Cancelled") return false;
  if (s.status === "Cancel Soon") return true;
  return (
    s.usageLevel === "Low" &&
    monthlyEquivalent(s) >= 8 &&
    (s.importance === "Optional" || s.importance === "Unknown")
  );
}

export function getPotentialSavings(subs: HomeSubscription[]): number {
  return round2(
    subs.filter(isCancelCandidate).reduce((sum, s) => sum + monthlyEquivalent(s), 0),
  );
}

export function getRenewalsWithinDays(
  subs: HomeSubscription[],
  days: number,
): HomeSubscription[] {
  return subs.filter(
    (s) =>
      s.status !== "Cancelled" &&
      isWithinDays(s.renewalDate, days),
  );
}

export function getTrialsEndingWithinDays(
  subs: HomeSubscription[],
  days: number,
): HomeSubscription[] {
  return subs.filter(
    (s) => s.status === "Trial" && isWithinDays(s.trialEndDate, days),
  );
}

export function getArrivalsToday(arrivals: HomeArrival[]): HomeArrival[] {
  return arrivals.filter(
    (a) =>
      isToday(a.expectedDate) &&
      a.status !== "Completed" &&
      a.status !== "Cancelled",
  );
}

export function getUpcomingArrivals(
  arrivals: HomeArrival[],
  days = 14,
): HomeArrival[] {
  return arrivals
    .filter(
      (a) =>
        isWithinDays(a.expectedDate, days) &&
        a.status !== "Completed" &&
        a.status !== "Cancelled",
    )
    .sort(
      (a, b) => (daysUntil(a.expectedDate) ?? 0) - (daysUntil(b.expectedDate) ?? 0),
    );
}

export function getProblemArrivals(arrivals: HomeArrival[]): HomeArrival[] {
  return arrivals.filter(
    (a) =>
      a.status === "Delayed" ||
      a.status === "Missed" ||
      a.status === "Needs Follow-up",
  );
}

export function getRoomSpend(items: RoomItem[], room?: Room): number {
  return round2(
    items
      .filter((i) => (room ? i.room === room : true))
      .reduce((sum, i) => sum + (i.price ?? 0), 0),
  );
}

export interface RoomCompletion {
  total: number;
  complete: number;
  inProgress: number;
  needed: number;
  percentage: number;
}

export function getRoomCompletion(items: RoomItem[], room?: Room): RoomCompletion {
  const list = room ? items.filter((i) => i.room === room) : items;
  const total = list.length;
  const complete = list.filter((i) =>
    ROOM_COMPLETE_STATUSES.includes(i.status),
  ).length;
  const inProgress = list.filter((i) =>
    ROOM_IN_PROGRESS_STATUSES.includes(i.status),
  ).length;
  const needed = list.filter((i) =>
    ROOM_NEEDED_STATUSES.includes(i.status),
  ).length;
  return {
    total,
    complete,
    inProgress,
    needed,
    percentage: total === 0 ? 0 : Math.round((complete / total) * 100),
  };
}

export function getRoomCompletionPercentage(items: RoomItem[], room?: Room): number {
  return getRoomCompletion(items, room).percentage;
}

export interface DeviceHealth {
  total: number;
  working: number;
  needsSetup: number;
  issue: number;
  needsRepair: number;
  warrantyClaim: number;
  replaceSoon: number;
  retired: number;
  warrantyEndingSoon: number;
  maintenanceDue: number;
}

export function getDeviceHealthSummary(
  devices: HomeDevice[],
  warrantyWarningDays = 30,
): DeviceHealth {
  const count = (s: HomeDevice["status"]) =>
    devices.filter((d) => d.status === s).length;
  return {
    total: devices.length,
    working: count("Working"),
    needsSetup: count("Needs Setup"),
    issue: count("Issue"),
    needsRepair: count("Needs Repair"),
    warrantyClaim: count("Warranty Claim"),
    replaceSoon: count("Replace Soon"),
    retired: count("Retired"),
    warrantyEndingSoon: devices.filter((d) =>
      isWithinDays(d.warrantyEndDate, warrantyWarningDays),
    ).length,
    maintenanceDue: getMaintenanceDueDevices(devices).length,
  };
}

/** The date a device's next maintenance check is due (or null). */
export function maintenanceDueDate(d: HomeDevice): string | null {
  if (!d.maintenanceIntervalDays || !d.lastCheckedAt) return null;
  return addDays(d.lastCheckedAt, d.maintenanceIntervalDays);
}

export function getMaintenanceDueDevices(devices: HomeDevice[]): HomeDevice[] {
  return devices.filter((d) => {
    const due = maintenanceDueDate(d);
    return due !== null && (isToday(due) || isOverdue(due));
  });
}

export interface WarrantyEndingItem {
  id: string;
  name: string;
  kind: "device" | "roomItem";
  warrantyEndDate: string;
}

export function getWarrantyEndingSoonItems(
  devices: HomeDevice[],
  roomItems: RoomItem[],
  days = 30,
): WarrantyEndingItem[] {
  const out: WarrantyEndingItem[] = [];
  for (const d of devices) {
    if (isWithinDays(d.warrantyEndDate, days)) {
      out.push({
        id: d.id,
        name: d.name,
        kind: "device",
        warrantyEndDate: d.warrantyEndDate!,
      });
    }
  }
  for (const r of roomItems) {
    if (isWithinDays(r.warrantyEndDate, days)) {
      out.push({
        id: r.id,
        name: r.name,
        kind: "roomItem",
        warrantyEndDate: r.warrantyEndDate!,
      });
    }
  }
  return out;
}

export interface AlertCounts {
  open: number;
  critical: number;
  warning: number;
  info: number;
  resolved: number;
  snoozed: number;
}

export function getOpenAlertCounts(alerts: HomeAlert[]): AlertCounts {
  const open = alerts.filter((a) => a.status === "Open");
  return {
    open: open.length,
    critical: open.filter((a) => a.severity === "Critical").length,
    warning: open.filter((a) => a.severity === "Warning").length,
    info: open.filter((a) => a.severity === "Info").length,
    resolved: alerts.filter((a) => a.status === "Resolved").length,
    snoozed: alerts.filter((a) => a.status === "Snoozed").length,
  };
}

// ---- Home Control Score ----------------------------------------------------

export interface ControlScore {
  score: number;
  label: string;
  explanation: string;
}

export function getHomeControlScore(data: HomeOSData): ControlScore {
  const openAlerts = data.alerts.filter((a) => a.status === "Open");
  const critical = openAlerts.filter((a) => a.severity === "Critical").length;
  const warning = openAlerts.filter((a) => a.severity === "Warning").length;

  const overdueItems =
    data.roomItems.filter(
      (i) =>
        isOverdue(i.returnDeadline) &&
        i.status !== "Returned" &&
        i.status !== "Complete",
    ).length + data.documents.filter((d) => isOverdue(d.expiryDate)).length;

  const deviceIssues = data.devices.filter(
    (d) =>
      d.status === "Issue" ||
      d.status === "Needs Repair" ||
      d.status === "Warranty Claim",
  ).length;

  const missedArrivals = data.arrivals.filter((a) => a.status === "Missed").length;

  const cancelSoon = data.subscriptions.filter(
    (s) => s.status === "Cancel Soon",
  ).length;

  const returnsSoon = data.roomItems.filter(
    (i) =>
      isWithinDays(i.returnDeadline, 7) &&
      i.status !== "Returned" &&
      i.status !== "Complete",
  ).length;

  const warrantySoon = getWarrantyEndingSoonItems(
    data.devices,
    data.roomItems,
    30,
  ).length;

  const deductions: { n: number; per: number; label: string }[] = [
    { n: critical, per: 12, label: `${critical} critical alert` },
    { n: warning, per: 6, label: `${warning} warning alert` },
    { n: overdueItems, per: 5, label: `${overdueItems} overdue item` },
    { n: deviceIssues, per: 4, label: `${deviceIssues} device issue` },
    { n: missedArrivals, per: 4, label: `${missedArrivals} missed arrival` },
    { n: cancelSoon, per: 3, label: `${cancelSoon} unresolved cancel-soon` },
    { n: returnsSoon, per: 2, label: `${returnsSoon} return deadline soon` },
    { n: warrantySoon, per: 2, label: `${warrantySoon} warranty ending soon` },
  ];

  const total = deductions.reduce((sum, d) => sum + d.n * d.per, 0);
  const score = Math.max(0, 100 - total);

  const label =
    score >= 90
      ? "Smooth"
      : score >= 75
        ? "Mostly Controlled"
        : score >= 55
          ? "Needs Attention"
          : score >= 30
            ? "Messy"
            : "Chaos Mode";

  const drivers = deductions
    .filter((d) => d.n > 0)
    .map((d) => `${d.label}${d.n > 1 ? "s" : ""}`);
  const explanation =
    drivers.length === 0
      ? "Everything's in order — no deductions."
      : `Score reduced by ${drivers.join(", ")}.`;

  return { score, label, explanation };
}

// ---- Combined HomeOS calendar ----------------------------------------------

export interface CalendarEvent {
  id: string;
  title: string;
  module: HomeModule;
  date: string;
  kind: string;
  linkedEntityType: "subscription" | "arrival" | "roomItem" | "device" | "document";
  linkedEntityId: string;
  critical: boolean;
}

export function getCalendarEvents(data: HomeOSData): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const push = (e: CalendarEvent) => events.push(e);

  for (const s of data.subscriptions) {
    if (s.renewalDate)
      push(ev(`${s.name} renews`, "SubscriptionOps", s.renewalDate, "Renewal", "subscription", s.id, false));
    if (s.trialEndDate)
      push(ev(`${s.name} trial ends`, "SubscriptionOps", s.trialEndDate, "Trial end", "subscription", s.id, true));
    if (s.contractEndDate)
      push(ev(`${s.name} contract ends`, "SubscriptionOps", s.contractEndDate, "Contract end", "subscription", s.id, false));
  }
  for (const a of data.arrivals) {
    if (a.expectedDate)
      push(ev(a.title, "ArrivalOps", a.expectedDate, a.type, "arrival", a.id, a.priority === "Critical"));
  }
  for (const r of data.roomItems) {
    if (r.deliveryDate)
      push(ev(`${r.name} delivery`, "RoomOps", r.deliveryDate, "Delivery", "roomItem", r.id, false));
    if (r.returnDeadline)
      push(ev(`${r.name} return deadline`, "RoomOps", r.returnDeadline, "Return deadline", "roomItem", r.id, true));
    if (r.warrantyEndDate)
      push(ev(`${r.name} warranty ends`, "RoomOps", r.warrantyEndDate, "Warranty end", "roomItem", r.id, false));
  }
  for (const d of data.devices) {
    if (d.warrantyEndDate)
      push(ev(`${d.name} warranty ends`, "DeviceOps", d.warrantyEndDate, "Warranty end", "device", d.id, false));
    const due = maintenanceDueDate(d);
    if (due) push(ev(`${d.name} maintenance due`, "DeviceOps", due, "Maintenance", "device", d.id, false));
  }
  for (const doc of data.documents) {
    if (doc.expiryDate)
      push(ev(`${doc.title} expires`, "Home Vault", doc.expiryDate, "Document expiry", "document", doc.id, false));
  }

  return events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

function ev(
  title: string,
  module: HomeModule,
  date: string,
  kind: string,
  linkedEntityType: CalendarEvent["linkedEntityType"],
  linkedEntityId: string,
  critical: boolean,
): CalendarEvent {
  return {
    id: `${module}-${linkedEntityId}-${kind}`,
    title,
    module,
    date,
    kind,
    linkedEntityType,
    linkedEntityId,
    critical,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export { isCancelCandidate };

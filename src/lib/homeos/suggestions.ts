import {
  getMaintenanceDueDevices,
  getMonthlySubscriptionTotal,
  getProblemArrivals,
  getRoomCompletion,
  getWarrantyEndingSoonItems,
  monthlyEquivalent,
} from "./calculations";
import { isOverdue, isToday, isWithinDays, relativeLabel } from "./dates";
import type {
  HomeArrival,
  HomeDevice,
  HomeModule,
  HomeOSData,
  HomeSubscription,
  Priority,
  Room,
  RoomItem,
  LinkedEntityType,
} from "./types";

export type Verdict = "Keep" | "Review" | "Cancel candidate";

export interface Recommendation {
  verdict: Verdict;
  reason: string;
}

const ESSENTIAL_CATEGORIES = ["Utilities", "Broadband", "Insurance"];

export function getSubscriptionRecommendation(
  s: HomeSubscription,
  renewalWarningDays = 30,
  trialWarningDays = 7,
): Recommendation {
  const monthly = monthlyEquivalent(s);

  if (
    s.status !== "Cancelled" &&
    s.usageLevel === "Low" &&
    monthly >= 8 &&
    (s.importance === "Optional" || s.importance === "Unknown")
  ) {
    const soonBits: string[] = [];
    if (s.status === "Cancel Soon") soonBits.push("already marked Cancel Soon");
    return {
      verdict: "Cancel candidate",
      reason: `Cancel candidate: low usage, £${monthly.toFixed(2)}/month, ${s.importance.toLowerCase()}${
        soonBits.length ? `, and ${soonBits.join(", ")}` : ""
      }.`,
    };
  }

  if (
    s.usageLevel === "High" ||
    s.importance === "Essential" ||
    (ESSENTIAL_CATEGORIES.includes(s.category) && s.status === "Active")
  ) {
    return {
      verdict: "Keep",
      reason:
        s.importance === "Essential" || ESSENTIAL_CATEGORIES.includes(s.category)
          ? `Keep: essential ${s.category.toLowerCase()} service with high household importance.`
          : `Keep: high usage across the household.`,
    };
  }

  if (s.status === "Trial" && isWithinDays(s.trialEndDate, trialWarningDays)) {
    return { verdict: "Review", reason: `Review: trial ends ${relativeLabel(s.trialEndDate)}.` };
  }
  if (isWithinDays(s.renewalDate, renewalWarningDays)) {
    return { verdict: "Review", reason: `Review: renews ${relativeLabel(s.renewalDate)}.` };
  }
  if (s.priceIncreaseDetected) {
    return { verdict: "Review", reason: `Review: a price increase was detected.` };
  }
  if (s.usageLevel === "Unknown" || s.status === "Reviewing") {
    return { verdict: "Review", reason: `Review: usage is unclear — worth a quick look.` };
  }

  return { verdict: "Keep", reason: `Keep: no concerns flagged.` };
}

export function getArrivalBrief(a: HomeArrival): string {
  const when = a.expectedDate
    ? `${relativeLabel(a.expectedDate)}${a.expectedTimeWindow ? ` ${a.expectedTimeWindow}` : ""}`
    : "soon";
  const people = ["Tradesperson", "Installer", "Cleaner"].includes(a.type);

  if (people) {
    const bits = [`${a.title} arriving ${when}.`];
    if (a.roomOrLocation) bits.push(`Needs access to ${a.roomOrLocation}.`);
    bits.push(a.needsSomeoneHome ? "Someone must be home." : "Access can be left if arranged.");
    if (a.accessInstructions) bits.push(`Access: ${a.accessInstructions}.`);
    if (a.notes) bits.push(a.notes + ".");
    return bits.join(" ");
  }
  if (a.type === "Guest") {
    return `Guest arriving ${when}. ${a.notes ? a.notes + ". " : ""}Check any access or parking notes.`;
  }
  // Packages / deliveries / collections
  return `${a.title} expected ${when}. ${
    a.needsSomeoneHome
      ? "Someone should be available to receive it."
      : "No one needs to be home unless a hand-off is required."
  }`;
}

export function getRoomNextAction(items: RoomItem[], room: Room): string {
  const list = items.filter((i) => i.room === room);
  if (list.length === 0) return "Nothing planned yet — add an item to start.";

  const returning = list.find(
    (i) => i.status === "Returning" && i.returnDeadline,
  );
  if (returning)
    return `Sort the ${returning.name} return before the deadline (${relativeLabel(returning.returnDeadline)}).`;

  const assembling = list.find((i) => i.status === "Assembling");
  if (assembling) return `Finish assembling the ${assembling.name}.`;

  const comparing = list.find((i) => i.status === "Comparing");
  if (comparing) return `Make a decision on the ${comparing.name} (still comparing).`;

  const toBuy = list.find((i) => i.status === "Need to Buy");
  if (toBuy) return `Buy the ${toBuy.name} when you're ready.`;

  const idea = list.find((i) => i.status === "Idea");
  if (idea) return `Decide whether to go ahead with the ${idea.name}.`;

  return "This room is in good shape — nothing urgent.";
}

export function getDeviceTroubleshootingSuggestion(d: HomeDevice): string {
  const warrantyActive = d.warrantyEndDate ? !isOverdue(d.warrantyEndDate) : false;
  const hasIssue =
    d.status === "Issue" || d.status === "Needs Repair" || d.status === "Warranty Claim";

  if (hasIssue && warrantyActive)
    return "Warranty may still cover this. Check the warranty document before paying for a repair.";
  if (hasIssue && d.warrantyEndDate && isOverdue(d.warrantyEndDate))
    return "Warranty appears expired. Compare the repair cost against replacing it.";

  if (d.status === "Working") return "Device is marked working. No immediate action.";
  if (d.status === "Needs Setup")
    return "Find the manual or app setup flow and complete first-time setup.";

  switch (d.type) {
    case "Router":
      return "Restart the router, check your provider's service status, then contact broadband support.";
    case "Light":
    case "Plug":
      return "If simple bulb/cable checks don't fix it, book a qualified electrician.";
    case "Charger":
      return "Test another cable and plug before replacing the device.";
    case "Speaker":
      return "Check Wi-Fi, power-cycle it, then reconnect in the app.";
    default:
      return "Check the manual, then contact the manufacturer's support if it persists.";
  }
}

export interface RecommendedAction {
  title: string;
  reason: string;
  sourceModule: HomeModule;
  estimatedMinutes: number;
  priority: Priority;
  linkedEntityType: LinkedEntityType;
  linkedEntityId?: string;
}

const PRIORITY_RANK: Record<Priority, number> = {
  Critical: 0,
  High: 1,
  Normal: 2,
  Low: 3,
};

export function getRecommendedTodayActions(data: HomeOSData): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  for (const a of data.arrivals) {
    if (a.status === "Missed") {
      actions.push({
        title: `Follow up on missed ${a.title.toLowerCase()}`,
        reason: "A delivery was missed and needs rebooking.",
        sourceModule: "ArrivalOps",
        estimatedMinutes: 5,
        priority: "High",
        linkedEntityType: "arrival",
        linkedEntityId: a.id,
      });
    } else if (isToday(a.expectedDate) && a.needsSomeoneHome) {
      actions.push({
        title: `Be home for ${a.title.toLowerCase()}${a.expectedTimeWindow ? ` ${a.expectedTimeWindow}` : ""}`,
        reason: "Arriving today and someone needs to be in.",
        sourceModule: "ArrivalOps",
        estimatedMinutes: 5,
        priority: "High",
        linkedEntityType: "arrival",
        linkedEntityId: a.id,
      });
    }
  }

  for (const s of data.subscriptions) {
    if (s.status === "Trial" && isWithinDays(s.trialEndDate, data.settings.trialWarningDays)) {
      actions.push({
        title: `Decide whether to cancel the ${s.name} trial`,
        reason: `Trial ends ${relativeLabel(s.trialEndDate)} and may roll into a paid plan.`,
        sourceModule: "SubscriptionOps",
        estimatedMinutes: 5,
        priority: "High",
        linkedEntityType: "subscription",
        linkedEntityId: s.id,
      });
    } else if (s.status === "Cancel Soon") {
      actions.push({
        title: `Cancel ${s.name}`,
        reason: `Marked Cancel Soon at £${monthlyEquivalent(s).toFixed(2)}/month.`,
        sourceModule: "SubscriptionOps",
        estimatedMinutes: 10,
        priority: "Normal",
        linkedEntityType: "subscription",
        linkedEntityId: s.id,
      });
    }
  }

  for (const d of data.devices) {
    if (d.status === "Needs Repair") {
      actions.push({
        title: `Book a repair for the ${d.name.toLowerCase()}`,
        reason: d.issueDescription || "Marked as needing repair.",
        sourceModule: "DeviceOps",
        estimatedMinutes: 10,
        priority: "High",
        linkedEntityType: "device",
        linkedEntityId: d.id,
      });
    }
  }

  for (const r of data.roomItems) {
    const open = r.status !== "Returned" && r.status !== "Complete";
    if (open && isWithinDays(r.returnDeadline, data.settings.returnWarningDays)) {
      actions.push({
        title: `Return the ${r.name.toLowerCase()} before the deadline`,
        reason: `Return window closes ${relativeLabel(r.returnDeadline)}.`,
        sourceModule: "RoomOps",
        estimatedMinutes: 15,
        priority: "High",
        linkedEntityType: "roomItem",
        linkedEntityId: r.id,
      });
    }
  }

  return actions
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .slice(0, 5);
}

export interface ReviewSummary {
  attentionToday: string[];
  moneyRisks: string[];
  homeLogistics: string[];
  roomSetup: string[];
  deviceRisks: string[];
  nextActions: RecommendedAction[];
}

export function getHomeReviewSummary(data: HomeOSData): ReviewSummary {
  const openCritical = data.alerts.filter(
    (a) => a.status === "Open" && a.severity === "Critical",
  );

  const attentionToday: string[] = [];
  openCritical.forEach((a) => attentionToday.push(a.title));
  data.arrivals
    .filter((a) => isToday(a.expectedDate) && a.status !== "Completed" && a.status !== "Cancelled")
    .forEach((a) => attentionToday.push(`${a.title} arriving today`));
  data.roomItems
    .filter((r) => isToday(r.returnDeadline) && r.status !== "Returned" && r.status !== "Complete")
    .forEach((r) => attentionToday.push(`${r.name} return due today`));
  data.subscriptions
    .filter((s) => s.status === "Trial" && isToday(s.trialEndDate))
    .forEach((s) => attentionToday.push(`${s.name} trial ends today`));

  const moneyRisks: string[] = [];
  const total = getMonthlySubscriptionTotal(data.subscriptions);
  if (total > data.settings.highMonthlySpendThreshold)
    moneyRisks.push(`Subscriptions total ~£${total.toFixed(0)}/month (above your threshold).`);
  data.subscriptions
    .filter((s) => s.usageLevel === "Low" && monthlyEquivalent(s) >= 8 && s.status !== "Cancelled")
    .forEach((s) => moneyRisks.push(`${s.name}: low usage at £${monthlyEquivalent(s).toFixed(2)}/month.`));
  data.subscriptions
    .filter((s) => s.status === "Trial" && isWithinDays(s.trialEndDate, data.settings.trialWarningDays))
    .forEach((s) => moneyRisks.push(`${s.name} trial ends ${relativeLabel(s.trialEndDate)}.`));

  const homeLogistics: string[] = [];
  data.arrivals
    .filter((a) => (isToday(a.expectedDate) || relativeLabel(a.expectedDate) === "Tomorrow") && a.status !== "Completed")
    .forEach((a) => homeLogistics.push(`${a.title} ${relativeLabel(a.expectedDate)}${a.needsSomeoneHome ? " — someone home" : ""}.`));
  getProblemArrivals(data.arrivals).forEach((a) =>
    homeLogistics.push(`${a.title}: ${a.status}.`),
  );

  const roomSetup: string[] = [];
  const rooms = Array.from(new Set(data.roomItems.map((i) => i.room)));
  rooms.forEach((room) => {
    const c = getRoomCompletion(data.roomItems, room);
    if (c.percentage < 60 && c.total > 0)
      roomSetup.push(`${room}: ${c.percentage}% complete (${c.needed} still needed).`);
  });
  data.roomItems
    .filter((i) => i.status === "Comparing")
    .forEach((i) => roomSetup.push(`${i.name} stuck in comparing.`));
  data.roomItems
    .filter((i) => i.installerNeeded && !i.linkedArrivalId)
    .forEach((i) => roomSetup.push(`${i.name} needs an installer booked.`));

  const deviceRisks: string[] = [];
  data.devices
    .filter((d) => d.status === "Issue" || d.status === "Needs Repair" || d.status === "Warranty Claim")
    .forEach((d) => deviceRisks.push(`${d.name}: ${d.status}.`));
  getWarrantyEndingSoonItems(data.devices, [], data.settings.warrantyWarningDays).forEach((w) =>
    deviceRisks.push(`${w.name} warranty ends ${relativeLabel(w.warrantyEndDate)}.`),
  );
  getMaintenanceDueDevices(data.devices).forEach((d) =>
    deviceRisks.push(`${d.name} maintenance due.`),
  );

  return {
    attentionToday,
    moneyRisks,
    homeLogistics,
    roomSetup,
    deviceRisks,
    nextActions: getRecommendedTodayActions(data),
  };
}

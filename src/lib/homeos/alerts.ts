import { getMonthlySubscriptionTotal, maintenanceDueDate } from "./calculations";
import {
  isOverdue,
  isToday,
  isTomorrow,
  isWithinDays,
  nowIso,
  relativeLabel,
} from "./dates";
import type {
  AlertSeverity,
  HomeAlert,
  HomeModule,
  HomeOSData,
  HomeOSSettings,
  LinkedEntityType,
} from "./types";

interface DraftAlert {
  alertType: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  module: HomeModule;
  linkedEntityType: LinkedEntityType;
  linkedEntityId?: string;
  dueDate?: string;
}

function key(d: DraftAlert): string {
  return `${d.module}-${d.linkedEntityId ?? "none"}-${d.alertType}`;
}

/**
 * Compute the alerts implied by the current data + settings, then merge with
 * existing alerts so the user's Resolved/Snoozed state is preserved by key.
 */
export function regenerateAlerts(
  data: HomeOSData,
  existing: HomeAlert[],
): HomeAlert[] {
  const drafts = computeDrafts(data, data.settings);
  const byKey = new Map(existing.map((a) => [a.key, a]));
  const now = nowIso();

  return drafts.map((d): HomeAlert => {
    const k = key(d);
    const prior = byKey.get(k);
    // A resolved/snoozed alert that's no longer snoozed stays as the user left it.
    if (prior) {
      return {
        ...prior,
        title: d.title,
        message: d.message,
        severity: d.severity,
        dueDate: d.dueDate,
        updatedAt: now,
      };
    }
    return {
      id: `al_${k}`,
      key: k,
      title: d.title,
      message: d.message,
      severity: d.severity,
      module: d.module,
      linkedEntityType: d.linkedEntityType,
      linkedEntityId: d.linkedEntityId,
      dueDate: d.dueDate,
      status: "Open",
      createdAt: now,
      updatedAt: now,
    };
  });
}

function computeDrafts(data: HomeOSData, s: HomeOSSettings): DraftAlert[] {
  const out: DraftAlert[] = [];

  // ---- Subscriptions ----
  for (const sub of data.subscriptions) {
    if (s.alerts.trial && sub.status === "Trial" && isWithinDays(sub.trialEndDate, s.trialWarningDays)) {
      out.push({
        alertType: "trial-ending",
        title: `${sub.name} trial ends soon`,
        message: `The ${sub.name} trial ends on its trial date — decide before it rolls into a paid plan.`,
        severity: "Warning",
        module: "SubscriptionOps",
        linkedEntityType: "subscription",
        linkedEntityId: sub.id,
        dueDate: sub.trialEndDate,
      });
    }
    if (s.alerts.trial && (sub.status === "Trial" || sub.status === "Active") && isOverdue(sub.trialEndDate)) {
      out.push({
        alertType: "trial-overdue",
        title: `${sub.name} trial may have rolled into paid`,
        message: `${sub.name}'s trial end date has passed. Check whether you're now being charged.`,
        severity: "Critical",
        module: "SubscriptionOps",
        linkedEntityType: "subscription",
        linkedEntityId: sub.id,
        dueDate: sub.trialEndDate,
      });
    }
    if (
      s.alerts.subscriptionRenewal &&
      ["Active", "Reviewing", "Cancel Soon"].includes(sub.status) &&
      isWithinDays(sub.renewalDate, s.renewalWarningDays)
    ) {
      out.push({
        alertType: "renewal-soon",
        title: `${sub.name} renews soon`,
        message: `${sub.name} renews within ${s.renewalWarningDays} days. Review it if you're not sure.`,
        severity: "Warning",
        module: "SubscriptionOps",
        linkedEntityType: "subscription",
        linkedEntityId: sub.id,
        dueDate: sub.renewalDate,
      });
    }
    if (s.alerts.contract && isWithinDays(sub.contractEndDate, s.contractWarningDays)) {
      out.push({
        alertType: "contract-ending",
        title: `${sub.name} contract ends soon`,
        message: `The ${sub.name} contract ends soon — a good time to compare or renegotiate.`,
        severity: "Warning",
        module: "SubscriptionOps",
        linkedEntityType: "subscription",
        linkedEntityId: sub.id,
        dueDate: sub.contractEndDate,
      });
    }
    if (sub.status === "Cancel Soon") {
      out.push({
        alertType: "cancel-soon",
        title: `${sub.name} marked cancel soon`,
        message: `${sub.name} is marked Cancel Soon but hasn't been cancelled yet.`,
        severity: "Warning",
        module: "SubscriptionOps",
        linkedEntityType: "subscription",
        linkedEntityId: sub.id,
        dueDate: sub.renewalDate,
      });
    }
    if (sub.priceIncreaseDetected) {
      out.push({
        alertType: "price-increase",
        title: `Price increase detected for ${sub.name}`,
        message: `A price increase was flagged for ${sub.name}. Check it's still worth it.`,
        severity: "Warning",
        module: "SubscriptionOps",
        linkedEntityType: "subscription",
        linkedEntityId: sub.id,
      });
    }
    if (
      sub.usageLevel === "Low" &&
      sub.monthlyCost > 8 &&
      sub.status !== "Cancelled"
    ) {
      out.push({
        alertType: "low-usage-expensive",
        title: `${sub.name} is low-usage but costing money`,
        message: `${sub.name} is £${sub.monthlyCost}/month with low usage — a cancel candidate.`,
        severity: "Info",
        module: "SubscriptionOps",
        linkedEntityType: "subscription",
        linkedEntityId: sub.id,
      });
    }
  }

  if (s.alerts.highSpend) {
    const total = getMonthlySubscriptionTotal(data.subscriptions);
    if (total > s.highMonthlySpendThreshold) {
      out.push({
        alertType: "high-spend",
        title: "Monthly subscription spend is high",
        message: `Your subscriptions total about £${total.toFixed(0)}/month, above your £${s.highMonthlySpendThreshold} threshold.`,
        severity: "Warning",
        module: "SubscriptionOps",
        linkedEntityType: null,
      });
    }
  }

  // ---- Arrivals ----
  if (s.alerts.arrival) {
    for (const a of data.arrivals) {
      if (isToday(a.expectedDate) && a.status !== "Completed" && a.status !== "Cancelled") {
        out.push({
          alertType: "arriving-today",
          title: `${a.title} arriving today`,
          message: `${a.title}${a.expectedTimeWindow ? ` (${a.expectedTimeWindow})` : ""} is expected today.`,
          severity: "Info",
          module: "ArrivalOps",
          linkedEntityType: "arrival",
          linkedEntityId: a.id,
          dueDate: a.expectedDate,
        });
      }
      if (isTomorrow(a.expectedDate) && a.needsSomeoneHome) {
        out.push({
          alertType: "needs-home-tomorrow",
          title: `Someone needs to be home tomorrow`,
          message: `${a.title} arrives tomorrow${a.expectedTimeWindow ? ` (${a.expectedTimeWindow})` : ""} and needs someone home.`,
          severity: "Warning",
          module: "ArrivalOps",
          linkedEntityType: "arrival",
          linkedEntityId: a.id,
          dueDate: a.expectedDate,
        });
      }
      if (a.status === "Missed") {
        out.push({
          alertType: "missed",
          title: `${a.title} missed — needs follow-up`,
          message: `${a.title} was missed. Book a redelivery or follow up.`,
          severity: "Critical",
          module: "ArrivalOps",
          linkedEntityType: "arrival",
          linkedEntityId: a.id,
        });
      }
      if (a.status === "Delayed") {
        out.push({
          alertType: "delayed",
          title: `${a.title} delayed`,
          message: `${a.title} is delayed. Check for a new date.`,
          severity: "Warning",
          module: "ArrivalOps",
          linkedEntityType: "arrival",
          linkedEntityId: a.id,
        });
      }
      if (a.status === "Needs Follow-up") {
        out.push({
          alertType: "needs-followup",
          title: `${a.title} needs follow-up`,
          message: `${a.title} needs a follow-up action.`,
          severity: "Warning",
          module: "ArrivalOps",
          linkedEntityType: "arrival",
          linkedEntityId: a.id,
        });
      }
      // Arrived but not collected: a tracked delivery/collection whose date
      // has passed and that hasn't been marked done. Nudges you on the home
      // page until you confirm you've got it.
      const collectible =
        a.type === "Package" ||
        a.type === "Collection" ||
        a.type === "Grocery Delivery";
      if (
        collectible &&
        isOverdue(a.expectedDate) &&
        a.status !== "Completed" &&
        a.status !== "Cancelled" &&
        a.status !== "Missed"
      ) {
        out.push({
          alertType: "not-collected",
          title: `${a.title} not collected yet`,
          message: `${a.title}${a.trackingNumber ? ` (tracking ${a.trackingNumber})` : ""} was due ${relativeLabel(a.expectedDate)} but isn't marked collected. Mark it done once you've got it.`,
          severity: "Warning",
          module: "ArrivalOps",
          linkedEntityType: "arrival",
          linkedEntityId: a.id,
          dueDate: a.expectedDate,
        });
      }
    }
  }

  // ---- RoomOps ----
  if (s.alerts.returnDeadline) {
    for (const r of data.roomItems) {
      const open = r.status !== "Returned" && r.status !== "Complete";
      if (open && isWithinDays(r.returnDeadline, s.returnWarningDays)) {
        out.push({
          alertType: "return-soon",
          title: `${r.name} return deadline approaching`,
          message: `The return window for ${r.name} closes soon.`,
          severity: "Warning",
          module: "RoomOps",
          linkedEntityType: "roomItem",
          linkedEntityId: r.id,
          dueDate: r.returnDeadline,
        });
      }
      if (open && isOverdue(r.returnDeadline)) {
        out.push({
          alertType: "return-missed",
          title: `${r.name} return deadline missed`,
          message: `The return deadline for ${r.name} has passed.`,
          severity: "Critical",
          module: "RoomOps",
          linkedEntityType: "roomItem",
          linkedEntityId: r.id,
          dueDate: r.returnDeadline,
        });
      }
    }
  }
  for (const r of data.roomItems) {
    if (r.status === "Ordered" && (isToday(r.deliveryDate) || isTomorrow(r.deliveryDate))) {
      out.push({
        alertType: "delivery-soon",
        title: `${r.name} arriving ${isToday(r.deliveryDate) ? "today" : "tomorrow"}`,
        message: `${r.name} is due to be delivered ${isToday(r.deliveryDate) ? "today" : "tomorrow"}.`,
        severity: "Info",
        module: "RoomOps",
        linkedEntityType: "roomItem",
        linkedEntityId: r.id,
        dueDate: r.deliveryDate,
      });
    }
    if (r.assemblyRequired && r.status === "Delivered") {
      out.push({
        alertType: "ready-assemble",
        title: `${r.name} is ready to assemble`,
        message: `${r.name} has been delivered and needs assembling.`,
        severity: "Info",
        module: "RoomOps",
        linkedEntityType: "roomItem",
        linkedEntityId: r.id,
      });
    }
    if (
      r.installerNeeded &&
      (r.status === "Delivered" || r.status === "Ordered") &&
      !r.linkedArrivalId
    ) {
      out.push({
        alertType: "installer-needed",
        title: `${r.name} needs an installer booked`,
        message: `${r.name} needs an installer, but no visit is booked yet.`,
        severity: "Warning",
        module: "RoomOps",
        linkedEntityType: "roomItem",
        linkedEntityId: r.id,
      });
    }
  }

  // ---- DeviceOps ----
  for (const d of data.devices) {
    if (d.status === "Issue") {
      out.push({
        alertType: "device-issue",
        title: `${d.name} has an issue`,
        message: d.issueDescription || `${d.name} is reporting a problem.`,
        severity: "Warning",
        module: "DeviceOps",
        linkedEntityType: "device",
        linkedEntityId: d.id,
      });
    }
    if (d.status === "Needs Repair") {
      out.push({
        alertType: "device-repair",
        title: `${d.name} needs repair`,
        message: d.issueDescription || `${d.name} needs repairing.`,
        severity: "Critical",
        module: "DeviceOps",
        linkedEntityType: "device",
        linkedEntityId: d.id,
      });
    }
    if (d.status === "Warranty Claim") {
      out.push({
        alertType: "device-warranty-claim",
        title: `${d.name} warranty claim in progress`,
        message: `${d.name} has an open warranty claim.`,
        severity: "Critical",
        module: "DeviceOps",
        linkedEntityType: "device",
        linkedEntityId: d.id,
      });
    }
    if (s.alerts.warranty && isWithinDays(d.warrantyEndDate, s.warrantyWarningDays)) {
      out.push({
        alertType: "warranty-ending",
        title: `${d.name} warranty ending soon`,
        message: `${d.name}'s warranty ends soon. Note it before it lapses.`,
        severity: "Warning",
        module: "DeviceOps",
        linkedEntityType: "device",
        linkedEntityId: d.id,
        dueDate: d.warrantyEndDate,
      });
    }
    if (
      isOverdue(d.warrantyEndDate) &&
      (d.status === "Issue" || d.status === "Needs Repair" || d.status === "Warranty Claim")
    ) {
      out.push({
        alertType: "warranty-expired-issue",
        title: `${d.name} warranty expired with an open issue`,
        message: `${d.name} has a problem but the warranty appears to have expired.`,
        severity: "Critical",
        module: "DeviceOps",
        linkedEntityType: "device",
        linkedEntityId: d.id,
      });
    }
    if (s.alerts.maintenance) {
      const due = maintenanceDueDate(d);
      // Warn ahead of time per the "maintenance warning days" setting, as well
      // as on/after the due date.
      const warn = s.maintenanceWarningDays ?? 0;
      if (
        due &&
        (isToday(due) ||
          isOverdue(due) ||
          (warn > 0 && isWithinDays(due, warn)))
      ) {
        out.push({
          alertType: "maintenance-due",
          title: `${d.name} maintenance due`,
          message: `${d.name} is due for a maintenance check.`,
          severity: "Info",
          module: "DeviceOps",
          linkedEntityType: "device",
          linkedEntityId: d.id,
          dueDate: due,
        });
      }
    }
  }

  // ---- Home Vault ----
  if (s.alerts.documentExpiry) {
    for (const doc of data.documents) {
      if (isWithinDays(doc.expiryDate, 30)) {
        out.push({
          alertType: "doc-expiry-soon",
          title: `${doc.title} expires soon`,
          message: `${doc.title} expires within 30 days.`,
          severity: "Warning",
          module: "Home Vault",
          linkedEntityType: "document",
          linkedEntityId: doc.id,
          dueDate: doc.expiryDate,
        });
      }
      if (isOverdue(doc.expiryDate)) {
        out.push({
          alertType: "doc-expired",
          title: `${doc.title} has expired`,
          message: `${doc.title} expired. Renew or replace it.`,
          severity: "Critical",
          module: "Home Vault",
          linkedEntityType: "document",
          linkedEntityId: doc.id,
          dueDate: doc.expiryDate,
        });
      }
    }
  }

  return out;
}

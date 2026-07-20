"use client";

import * as React from "react";
import { CreditCard, Truck, Sofa, Cpu, FileText, Bell } from "lucide-react";
import { useHomeOS } from "@/lib/homeos/store";
import {
  ARRIVAL_TYPES,
  DEVICE_TYPES,
  DOCUMENT_TYPES,
  ROOMS,
  SUBSCRIPTION_CATEGORIES,
  SUBSCRIPTION_STATUSES,
  ARRIVAL_STATUSES,
  ROOM_ITEM_STATUSES,
  DEVICE_STATUSES,
  HOME_MODULES,
  type AlertSeverity,
  type HomeModule,
} from "@/lib/homeos/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal, Field } from "@/components/homeos/ui";
import { MODULE_LABEL } from "@/components/homeos/tabs";

type Kind = "subscription" | "arrival" | "room" | "device" | "document" | "alert";

const KINDS: { key: Kind; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "subscription", label: "Subscription", icon: CreditCard },
  { key: "arrival", label: "Arrival", icon: Truck },
  { key: "room", label: "Room Item", icon: Sofa },
  { key: "device", label: "Device", icon: Cpu },
  { key: "document", label: "Document", icon: FileText },
  { key: "alert", label: "Manual Alert", icon: Bell },
];

export function AddItemModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useHomeOS();
  const [kind, setKind] = React.useState<Kind | null>(null);
  const [form, setForm] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);

  function close() {
    setKind(null);
    setForm({});
    setError(null);
    onClose();
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  // Value-based setter for controls (like the date picker) that emit a string.
  const setVal = (k: string) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const num = (v?: string) => {
    const n = parseFloat(v ?? "");
    return Number.isNaN(n) ? 0 : n;
  };

  function save() {
    setError(null);
    try {
      if (kind === "subscription") {
        if (!form.name || !form.provider) return setError("Name and provider are required.");
        store.addSubscription({
          name: form.name,
          provider: form.provider,
          category: (form.category as never) ?? "Other",
          monthlyCost: num(form.monthlyCost),
          annualCost: num(form.annualCost),
          billingCycle: (form.billingCycle as never) ?? "Monthly",
          status: (form.status as never) ?? "Active",
          renewalDate: form.renewalDate || undefined,
          owner: form.owner || undefined,
          notes: form.notes || undefined,
          tags: [],
          importance: "Unknown",
          usageLevel: "Unknown",
          priceIncreaseDetected: false,
        });
      } else if (kind === "arrival") {
        if (!form.title) return setError("A title is required.");
        store.addArrival({
          title: form.title,
          type: (form.type as never) ?? "Package",
          status: (form.status as never) ?? "Scheduled",
          expectedDate: form.expectedDate || undefined,
          expectedTimeWindow: form.timeWindow || undefined,
          company: form.company || undefined,
          trackingNumber: form.trackingNumber || undefined,
          roomOrLocation: form.room || undefined,
          notes: form.notes || undefined,
          priority: "Normal",
          needsSomeoneHome: form.needsHome === "yes",
          linkedEntityType: null,
        });
      } else if (kind === "room") {
        if (!form.name) return setError("A name is required.");
        store.addRoomItem({
          name: form.name,
          room: (form.room as never) ?? "Other",
          status: (form.status as never) ?? "Idea",
          itemType: form.itemType || undefined,
          retailer: form.retailer || undefined,
          price: form.price ? num(form.price) : undefined,
          notes: form.notes || undefined,
          priority: "Normal",
          assemblyRequired: form.assembly === "yes",
          installerNeeded: form.installer === "yes",
        });
      } else if (kind === "device") {
        if (!form.name) return setError("A name is required.");
        store.addDevice({
          name: form.name,
          room: (form.room as never) ?? "Other",
          type: (form.type as never) ?? "Other",
          status: (form.status as never) ?? "Working",
          brand: form.brand || undefined,
          model: form.model || undefined,
          issueDescription: form.issue || undefined,
          notes: form.notes || undefined,
          troubleshootingSteps: [],
        });
      } else if (kind === "document") {
        if (!form.title) return setError("A title is required.");
        store.addDocument({
          title: form.title,
          type: (form.type as never) ?? "Other",
          provider: form.provider || undefined,
          date: form.date || undefined,
          expiryDate: form.expiryDate || undefined,
          fileUrl: form.fileUrl || undefined,
          notes: form.notes || undefined,
          linkedEntityType: null,
          tags: [],
        });
      } else if (kind === "alert") {
        if (!form.title || !form.message) return setError("Title and message are required.");
        store.addAlert({
          title: form.title,
          message: form.message,
          severity: (form.severity as AlertSeverity) ?? "Info",
          module: (form.module as HomeModule) ?? "HomeOS",
        });
      }
      close();
    } catch {
      setError("Could not save — please check the fields.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={kind ? `Add ${KINDS.find((k) => k.key === kind)?.label}` : "Add to HomeOS"}
      footer={
        kind ? (
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setKind(null)}>
              Back
            </Button>
            <Button onClick={save}>Save</Button>
          </div>
        ) : undefined
      }
    >
      {!kind ? (
        <div className="grid grid-cols-2 gap-2.5">
          {KINDS.map((k) => (
            <button
              key={k.key}
              onClick={() => setKind(k.key)}
              className="flex items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-accent"
            >
              <k.icon className="size-5 text-primary" />
              <span className="font-medium">{k.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {kind === "subscription" && (
            <>
              <Field label="Name"><Input value={form.name ?? ""} onChange={set("name")} /></Field>
              <Field label="Provider"><Input value={form.provider ?? ""} onChange={set("provider")} /></Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Monthly £"><Input type="number" value={form.monthlyCost ?? ""} onChange={set("monthlyCost")} /></Field>
                <Field label="Annual £"><Input type="number" value={form.annualCost ?? ""} onChange={set("annualCost")} /></Field>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Billing cycle"><Select value={form.billingCycle ?? "Monthly"} onChange={set("billingCycle")}>{["Monthly","Annual","Weekly","Quarterly","Trial","Other"].map((o)=><option key={o}>{o}</option>)}</Select></Field>
                <Field label="Status"><Select value={form.status ?? "Active"} onChange={set("status")}>{SUBSCRIPTION_STATUSES.map((o)=><option key={o}>{o}</option>)}</Select></Field>
              </div>
              <Field label="Category"><Select value={form.category ?? "Other"} onChange={set("category")}>{SUBSCRIPTION_CATEGORIES.map((o)=><option key={o}>{o}</option>)}</Select></Field>
              <Field label="Renewal date"><DatePicker value={form.renewalDate ?? ""} onChange={setVal("renewalDate")} /></Field>
              <Field label="Owner"><Input value={form.owner ?? ""} onChange={set("owner")} /></Field>
            </>
          )}

          {kind === "arrival" && (
            <>
              <Field label="Title"><Input value={form.title ?? ""} onChange={set("title")} /></Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Type"><Select value={form.type ?? "Package"} onChange={set("type")}>{ARRIVAL_TYPES.map((o)=><option key={o}>{o}</option>)}</Select></Field>
                <Field label="Status"><Select value={form.status ?? "Scheduled"} onChange={set("status")}>{ARRIVAL_STATUSES.map((o)=><option key={o}>{o}</option>)}</Select></Field>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Expected date"><DatePicker value={form.expectedDate ?? ""} onChange={setVal("expectedDate")} /></Field>
                <Field label="Time window"><Input value={form.timeWindow ?? ""} onChange={set("timeWindow")} placeholder="9–12" /></Field>
              </div>
              <Field label="Company"><Input value={form.company ?? ""} onChange={set("company")} placeholder="e.g. Royal Mail" /></Field>
              <Field label="Tracking number"><Input value={form.trackingNumber ?? ""} onChange={set("trackingNumber")} placeholder="Royal Mail tracking code" /></Field>
              <Field label="Needs someone home?"><Select value={form.needsHome ?? "no"} onChange={set("needsHome")}><option value="no">No</option><option value="yes">Yes</option></Select></Field>
            </>
          )}

          {kind === "room" && (
            <>
              <Field label="Name"><Input value={form.name ?? ""} onChange={set("name")} /></Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Room"><Select value={form.room ?? "Living Room"} onChange={set("room")}>{ROOMS.map((o)=><option key={o}>{o}</option>)}</Select></Field>
                <Field label="Status"><Select value={form.status ?? "Idea"} onChange={set("status")}>{ROOM_ITEM_STATUSES.map((o)=><option key={o}>{o}</option>)}</Select></Field>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Retailer"><Input value={form.retailer ?? ""} onChange={set("retailer")} /></Field>
                <Field label="Price £"><Input type="number" value={form.price ?? ""} onChange={set("price")} /></Field>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Assembly?"><Select value={form.assembly ?? "no"} onChange={set("assembly")}><option value="no">No</option><option value="yes">Yes</option></Select></Field>
                <Field label="Installer?"><Select value={form.installer ?? "no"} onChange={set("installer")}><option value="no">No</option><option value="yes">Yes</option></Select></Field>
              </div>
            </>
          )}

          {kind === "device" && (
            <>
              <Field label="Name"><Input value={form.name ?? ""} onChange={set("name")} /></Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Room"><Select value={form.room ?? "Living Room"} onChange={set("room")}>{ROOMS.map((o)=><option key={o}>{o}</option>)}</Select></Field>
                <Field label="Type"><Select value={form.type ?? "Appliance"} onChange={set("type")}>{DEVICE_TYPES.map((o)=><option key={o}>{o}</option>)}</Select></Field>
              </div>
              <Field label="Status"><Select value={form.status ?? "Working"} onChange={set("status")}>{DEVICE_STATUSES.map((o)=><option key={o}>{o}</option>)}</Select></Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Brand"><Input value={form.brand ?? ""} onChange={set("brand")} /></Field>
                <Field label="Model"><Input value={form.model ?? ""} onChange={set("model")} /></Field>
              </div>
              <Field label="Issue (if any)"><Input value={form.issue ?? ""} onChange={set("issue")} /></Field>
            </>
          )}

          {kind === "document" && (
            <>
              <Field label="Title"><Input value={form.title ?? ""} onChange={set("title")} /></Field>
              <Field label="Type"><Select value={form.type ?? "Receipt"} onChange={set("type")}>{DOCUMENT_TYPES.map((o)=><option key={o}>{o}</option>)}</Select></Field>
              <Field label="Provider"><Input value={form.provider ?? ""} onChange={set("provider")} /></Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Date"><DatePicker value={form.date ?? ""} onChange={setVal("date")} /></Field>
                <Field label="Expiry"><DatePicker value={form.expiryDate ?? ""} onChange={setVal("expiryDate")} /></Field>
              </div>
              <Field label="File URL / name"><Input value={form.fileUrl ?? ""} onChange={set("fileUrl")} placeholder="receipt.pdf" /></Field>
            </>
          )}

          {kind === "alert" && (
            <>
              <Field label="Title"><Input value={form.title ?? ""} onChange={set("title")} /></Field>
              <Field label="Message"><Textarea value={form.message ?? ""} onChange={set("message")} /></Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Severity"><Select value={form.severity ?? "Info"} onChange={set("severity")}>{["Critical","Warning","Info"].map((o)=><option key={o}>{o}</option>)}</Select></Field>
                <Field label="Module"><Select value={form.module ?? "HomeOS"} onChange={set("module")}>{HOME_MODULES.map((o)=><option key={o} value={o}>{MODULE_LABEL[o]}</option>)}</Select></Field>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}

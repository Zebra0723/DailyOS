"use client";

import * as React from "react";
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Settings,
  ShieldCheck,
  CalendarClock,
  Search,
  Plus,
  ExternalLink,
  Trash2,
  Lightbulb,
} from "lucide-react";

import { useHomeOS } from "@/lib/homeos/store";
import {
  getDeviceHealthSummary,
  getMaintenanceDueDevices,
  maintenanceDueDate,
} from "@/lib/homeos/calculations";
import { getDeviceTroubleshootingSuggestion } from "@/lib/homeos/suggestions";
import {
  relativeLabel,
  formatDate,
  isWithinDays,
  isOverdue,
} from "@/lib/homeos/dates";
import {
  DEVICE_TYPES,
  DEVICE_STATUSES,
  ROOMS,
  type HomeDevice,
  type DeviceStatus,
  type DeviceType,
  type Room,
} from "@/lib/homeos/types";

import {
  StatCard,
  StatusPill,
  Section,
  HomeEmpty,
  Drawer,
  DetailRow,
} from "@/components/homeos/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---- Status → pill tone ----------------------------------------------------

type PillTone = "green" | "amber" | "red" | "blue" | "grey";

const STATUS_TONE: Record<DeviceStatus, PillTone> = {
  Working: "green",
  "Needs Setup": "blue",
  Issue: "amber",
  "Needs Repair": "red",
  "Warranty Claim": "red",
  "Replace Soon": "amber",
  Retired: "grey",
};

function DeviceStatusPill({ status }: { status: DeviceStatus }) {
  return <StatusPill label={status} tone={STATUS_TONE[status]} />;
}

// ============================================================================

export function DeviceOps() {
  const { data, updateDevice, deleteDevice, addTodayAction } = useHomeOS();
  const devices = data.devices;

  const summary = React.useMemo(
    () => getDeviceHealthSummary(devices),
    [devices],
  );
  const maintenanceDueIds = React.useMemo(
    () => new Set(getMaintenanceDueDevices(devices).map((d) => d.id)),
    [devices],
  );

  // ---- Filters -------------------------------------------------------------
  const [search, setSearch] = React.useState("");
  const [room, setRoom] = React.useState<"all" | Room>("all");
  const [type, setType] = React.useState<"all" | DeviceType>("all");
  const [status, setStatus] = React.useState<"all" | DeviceStatus>("all");
  const [warrantySoonOnly, setWarrantySoonOnly] = React.useState(false);
  const [maintenanceDueOnly, setMaintenanceDueOnly] = React.useState(false);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const selected = devices.find((d) => d.id === selectedId) ?? null;

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return devices.filter((d) => {
      if (q) {
        const haystack = [d.name, d.brand, d.model, d.type, d.room]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (room !== "all" && d.room !== room) return false;
      if (type !== "all" && d.type !== type) return false;
      if (status !== "all" && d.status !== status) return false;
      if (warrantySoonOnly && !isWithinDays(d.warrantyEndDate, 30)) return false;
      if (maintenanceDueOnly && !maintenanceDueIds.has(d.id)) return false;
      return true;
    });
  }, [
    devices,
    search,
    room,
    type,
    status,
    warrantySoonOnly,
    maintenanceDueOnly,
    maintenanceDueIds,
  ]);

  return (
    <div className="space-y-6">
      <Section
        title="DeviceOps"
        description="Track appliances, electronics, issues, warranties, and maintenance."
      >
        {/* Overview */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <StatCard label="Total" value={summary.total} icon={Cpu} />
          <StatCard
            label="Working"
            value={summary.working}
            icon={CheckCircle2}
            tone="green"
          />
          <StatCard
            label="Issues"
            value={summary.issue}
            icon={AlertTriangle}
            tone="amber"
          />
          <StatCard
            label="Needs Setup"
            value={summary.needsSetup}
            icon={Settings}
            tone="primary"
          />
          <StatCard
            label="Needs Repair"
            value={summary.needsRepair}
            icon={Wrench}
            tone="red"
          />
          <StatCard
            label="Warranty Soon"
            value={summary.warrantyEndingSoon}
            icon={ShieldCheck}
            tone="amber"
          />
          <StatCard
            label="Maint. Due"
            value={summary.maintenanceDue}
            icon={CalendarClock}
            tone={summary.maintenanceDue > 0 ? "red" : "default"}
          />
        </div>
      </Section>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search devices…"
                className="pl-9"
              />
            </div>
            <Select
              value={room}
              onChange={(e) => setRoom(e.target.value as "all" | Room)}
            >
              <option value="all">All rooms</option>
              {ROOMS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as "all" | DeviceType)}
            >
              <option value="all">All types</option>
              {DEVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "all" | DeviceStatus)
              }
            >
              <option value="all">All statuses</option>
              {DEVICE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={warrantySoonOnly ? "default" : "outline"}
              onClick={() => setWarrantySoonOnly((v) => !v)}
            >
              <ShieldCheck />
              Warranty ending soon
            </Button>
            <Button
              type="button"
              size="sm"
              variant={maintenanceDueOnly ? "default" : "outline"}
              onClick={() => setMaintenanceDueOnly((v) => !v)}
            >
              <CalendarClock />
              Maintenance due
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {devices.length === 0 ? (
        <HomeEmpty message="No devices yet. Add appliances, electronics, and smart devices to track issues and warranties." />
      ) : filtered.length === 0 ? (
        <HomeEmpty message="No devices match these filters." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <DeviceCard
              key={d.id}
              device={d}
              maintenanceDue={maintenanceDueIds.has(d.id)}
              onOpen={() => setSelectedId(d.id)}
            />
          ))}
        </div>
      )}

      <DeviceDrawer
        device={selected}
        onClose={() => setSelectedId(null)}
        updateDevice={updateDevice}
        deleteDevice={deleteDevice}
        addTodayAction={addTodayAction}
      />
    </div>
  );
}

// ---- Device card -----------------------------------------------------------

function DeviceCard({
  device,
  maintenanceDue,
  onOpen,
}: {
  device: HomeDevice;
  maintenanceDue: boolean;
  onOpen: () => void;
}) {
  const brandModel = [device.brand, device.model].filter(Boolean).join(" ");
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/40"
      onClick={onOpen}
    >
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate font-semibold">{device.name}</div>
            <div className="text-xs text-muted-foreground">
              {device.room} · {device.type}
            </div>
          </div>
          <DeviceStatusPill status={device.status} />
        </div>

        {brandModel && (
          <div className="text-sm text-muted-foreground">{brandModel}</div>
        )}

        {device.status === "Issue" && device.issueDescription && (
          <div className="line-clamp-2 text-sm text-amber-700 dark:text-amber-400">
            {device.issueDescription}
          </div>
        )}

        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {device.warrantyEndDate && (
            <span
              className={cn(
                isOverdue(device.warrantyEndDate) && "text-red-600 dark:text-red-400",
                isWithinDays(device.warrantyEndDate, 30) &&
                  "text-amber-600 dark:text-amber-400",
              )}
            >
              Warranty {relativeLabel(device.warrantyEndDate)}
            </span>
          )}
          {device.lastCheckedAt && (
            <span>Checked {relativeLabel(device.lastCheckedAt)}</span>
          )}
          {device.maintenanceIntervalDays != null && (
            <span
              className={cn(
                maintenanceDue && "text-red-600 dark:text-red-400",
              )}
            >
              Maint. every {device.maintenanceIntervalDays}d
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Drawer ----------------------------------------------------------------

const STATUS_ACTIONS: { status: DeviceStatus; label: string }[] = [
  { status: "Working", label: "Mark working" },
  { status: "Needs Setup", label: "Needs setup" },
  { status: "Issue", label: "Issue" },
  { status: "Needs Repair", label: "Needs repair" },
  { status: "Warranty Claim", label: "Warranty claim" },
  { status: "Replace Soon", label: "Replace soon" },
];

function DeviceDrawer({
  device,
  onClose,
  updateDevice,
  deleteDevice,
  addTodayAction,
}: {
  device: HomeDevice | null;
  onClose: () => void;
  updateDevice: ReturnType<typeof useHomeOS>["updateDevice"];
  deleteDevice: ReturnType<typeof useHomeOS>["deleteDevice"];
  addTodayAction: ReturnType<typeof useHomeOS>["addTodayAction"];
}) {
  const [newStep, setNewStep] = React.useState("");
  const [note, setNote] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  // Reset transient state whenever the selected device changes.
  React.useEffect(() => {
    setNewStep("");
    setNote("");
    setConfirmDelete(false);
  }, [device?.id]);

  if (!device) return null;

  const warrantyActive = device.warrantyEndDate
    ? !isOverdue(device.warrantyEndDate)
    : null;
  const dueDate = maintenanceDueDate(device);
  const maintenanceOverdue = dueDate
    ? isOverdue(dueDate) || relativeLabel(dueDate) === "Today"
    : false;
  const suggestion = getDeviceTroubleshootingSuggestion(device);

  const addStep = () => {
    const step = newStep.trim();
    if (!step) return;
    updateDevice(device.id, {
      troubleshootingSteps: [...device.troubleshootingSteps, step],
    });
    setNewStep("");
  };

  const saveNote = () => {
    const text = note.trim();
    if (!text) return;
    const existing = device.notes ? `${device.notes}\n` : "";
    updateDevice(device.id, { notes: `${existing}${text}` });
    setNote("");
  };

  const setStatus = (status: DeviceStatus) =>
    updateDevice(device.id, { status });

  const pushToToday = () =>
    addTodayAction({
      title: `Look at ${device.name}`,
      source: "HomeOS",
      sourceModule: "DeviceOps",
      linkedEntityType: "device",
      linkedEntityId: device.id,
      priority: "High",
      estimatedMinutes: 10,
      status: "Not Started",
    });

  const onDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteDevice(device.id);
    onClose();
  };

  return (
    <Drawer
      open={!!device}
      onClose={onClose}
      title={device.name}
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 />
            {confirmDelete ? "Confirm delete" : "Delete"}
          </Button>
          <Button type="button" size="sm" onClick={pushToToday}>
            <Plus />
            Add to Today
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status + quick actions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <DeviceStatusPill status={device.status} />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_ACTIONS.map((a) => (
              <Button
                key={a.status}
                type="button"
                size="sm"
                variant={device.status === a.status ? "default" : "outline"}
                onClick={() => setStatus(a.status)}
              >
                {a.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="divide-y">
          <DetailRow label="Room" value={device.room} />
          <DetailRow label="Type" value={device.type} />
          <DetailRow label="Brand" value={device.brand} />
          <DetailRow label="Model" value={device.model} />
          <DetailRow
            label="Purchased"
            value={device.purchaseDate ? formatDate(device.purchaseDate) : null}
          />
          <DetailRow label="Power rating" value={device.powerRating} />
          <DetailRow label="Connected to" value={device.connectedTo} />
          <DetailRow
            label="Warranty ends"
            value={
              device.warrantyEndDate
                ? `${formatDate(device.warrantyEndDate)} (${relativeLabel(device.warrantyEndDate)})`
                : null
            }
          />
          <DetailRow
            label="Warranty status"
            value={
              warrantyActive === null
                ? null
                : warrantyActive
                  ? "Active"
                  : "Expired"
            }
          />
          <DetailRow
            label="Last checked"
            value={
              device.lastCheckedAt
                ? `${formatDate(device.lastCheckedAt)} (${relativeLabel(device.lastCheckedAt)})`
                : null
            }
          />
          <DetailRow
            label="Maintenance interval"
            value={
              device.maintenanceIntervalDays != null
                ? `Every ${device.maintenanceIntervalDays} days`
                : null
            }
          />
          <DetailRow
            label="Maintenance due"
            value={
              dueDate
                ? `${formatDate(dueDate)} (${relativeLabel(dueDate)})${maintenanceOverdue ? " — due" : ""}`
                : null
            }
          />
          <DetailRow label="Issue" value={device.issueDescription} />
        </div>

        {/* Links */}
        {(device.manualUrl || device.supportUrl) && (
          <div className="flex flex-wrap gap-2">
            {device.manualUrl && (
              <Button asChild type="button" size="sm" variant="outline">
                <a href={device.manualUrl} target="_blank" rel="noreferrer">
                  <ExternalLink />
                  Manual
                </a>
              </Button>
            )}
            {device.supportUrl && (
              <Button asChild type="button" size="sm" variant="outline">
                <a href={device.supportUrl} target="_blank" rel="noreferrer">
                  <ExternalLink />
                  Support
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Suggestion */}
        <div className="flex gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div>
            <div className="font-medium">Suggestion</div>
            <p className="text-muted-foreground">{suggestion}</p>
          </div>
        </div>

        {/* Troubleshooting steps */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Troubleshooting steps</h4>
          {device.troubleshootingSteps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No steps logged yet.</p>
          ) : (
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {device.troubleshootingSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          )}
          <div className="flex gap-2">
            <Input
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addStep();
                }
              }}
              placeholder="Add troubleshooting step…"
            />
            <Button type="button" size="sm" onClick={addStep}>
              <Plus />
              Add
            </Button>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Notes</h4>
          {device.notes && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {device.notes}
            </p>
          )}
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note…"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={saveNote}
            >
              Add note
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

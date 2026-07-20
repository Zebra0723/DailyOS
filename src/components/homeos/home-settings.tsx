"use client";

import * as React from "react";
import {
  Check,
  Download,
  Home,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import { useHomeOS } from "@/lib/homeos/store";
import { usePlan } from "@/lib/use-pro";
import type { HomeOSSettings } from "@/lib/homeos/types";
import { Section } from "@/components/homeos/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/components/ui/confirm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AlertKey = keyof HomeOSSettings["alerts"];

const ALERT_FIELDS: { key: AlertKey; label: string; hint: string }[] = [
  {
    key: "subscriptionRenewal",
    label: "Subscription renewals",
    hint: "Warn before a subscription renews.",
  },
  { key: "trial", label: "Free trials", hint: "Warn before a trial converts to paid." },
  {
    key: "contract",
    label: "Contract endings",
    hint: "Warn before a contract term ends.",
  },
  {
    key: "arrival",
    label: "Arrivals",
    hint: "Remind you about upcoming deliveries and visits.",
  },
  {
    key: "returnDeadline",
    label: "Return deadlines",
    hint: "Warn before a return window closes.",
  },
  {
    key: "warranty",
    label: "Warranties",
    hint: "Warn before a warranty expires.",
  },
  {
    key: "maintenance",
    label: "Maintenance",
    hint: "Flag devices due for a maintenance check.",
  },
  {
    key: "documentExpiry",
    label: "Document expiry",
    hint: "Warn before a stored document expires.",
  },
  {
    key: "highSpend",
    label: "High monthly spend",
    hint: "Flag when subscriptions exceed your threshold.",
  },
];

type ThresholdKey =
  | "renewalWarningDays"
  | "trialWarningDays"
  | "contractWarningDays"
  | "returnWarningDays"
  | "warrantyWarningDays"
  | "maintenanceWarningDays"
  | "highMonthlySpendThreshold";

const THRESHOLD_FIELDS: {
  key: ThresholdKey;
  label: string;
  hint: string;
}[] = [
  { key: "renewalWarningDays", label: "Renewal warning (days)", hint: "Lead time before renewals." },
  { key: "trialWarningDays", label: "Trial warning (days)", hint: "Lead time before trials end." },
  {
    key: "contractWarningDays",
    label: "Contract warning (days)",
    hint: "Lead time before contracts end.",
  },
  { key: "returnWarningDays", label: "Return warning (days)", hint: "Lead time before return deadlines." },
  {
    key: "warrantyWarningDays",
    label: "Warranty warning (days)",
    hint: "Lead time before warranties expire.",
  },
  {
    key: "maintenanceWarningDays",
    label: "Maintenance warning (days)",
    hint: "Lead time before maintenance is due.",
  },
  {
    key: "highMonthlySpendThreshold",
    label: "High monthly spend threshold",
    hint: "Flag total monthly spend above this amount.",
  },
];

function ToggleRow({
  label,
  hint,
  checked,
  onToggle,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 rounded-xl border bg-background px-4 py-3 text-left transition-colors hover:bg-accent/40"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "inline-flex size-5 items-center justify-center rounded-full bg-background shadow-sm transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        >
          {checked && <Check className="size-3 text-primary" />}
        </span>
      </span>
    </button>
  );
}

export function HomeSettings() {
  const {
    data,
    updateProfile,
    updateSettings,
    resetDemoData,
    clearHomeOSData,
    exportHomeOSJSON,
    importHomeOSJSON,
  } = useHomeOS();
  const { admin } = usePlan();
  const confirm = useConfirm();

  const { homeProfile, settings } = data;

  const [name, setName] = React.useState(homeProfile.name);
  const [addressLabel, setAddressLabel] = React.useState(homeProfile.addressLabel);
  const [members, setMembers] = React.useState(homeProfile.householdMembers.join(", "));

  React.useEffect(() => {
    setName(homeProfile.name);
    setAddressLabel(homeProfile.addressLabel);
    setMembers(homeProfile.householdMembers.join(", "));
  }, [homeProfile.name, homeProfile.addressLabel, homeProfile.householdMembers]);

  const [profileSaved, setProfileSaved] = React.useState(false);

  function saveProfile() {
    updateProfile({
      name: name.trim(),
      addressLabel: addressLabel.trim(),
      householdMembers: members
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m.length > 0),
    });
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 2000);
  }

  function toggleAlert(key: AlertKey) {
    updateSettings({
      alerts: { ...settings.alerts, [key]: !settings.alerts[key] },
    });
  }

  function setThreshold(key: ThresholdKey, raw: string) {
    const n = Number(raw);
    if (raw === "" || Number.isNaN(n)) return;
    updateSettings({ [key]: n } as Partial<HomeOSSettings>);
  }

  const [exported, setExported] = React.useState("");
  const [importText, setImportText] = React.useState("");
  const [importResult, setImportResult] = React.useState<
    { ok: boolean; error?: string } | null
  >(null);

  function handleExport() {
    setExported(exportHomeOSJSON());
  }

  function handleImport() {
    setImportResult(importHomeOSJSON(importText));
  }

  async function handleReset() {
    if (
      await confirm({
        title: "Reset HomeOS to demo data?",
        description: "This replaces your current data.",
        confirmText: "Reset",
        destructive: true,
      })
    ) {
      resetDemoData();
    }
  }

  async function handleClear() {
    if (
      await confirm({
        title: "Clear all HomeOS data?",
        confirmText: "Clear data",
        destructive: true,
      })
    ) {
      clearHomeOSData();
    }
  }

  return (
    <Section
      title="HomeOS Settings"
      description="Configure your home profile, alerts, warning thresholds, and data."
    >
      <div className="space-y-6">
        {/* Home Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="size-4 text-muted-foreground" />
              Home Profile
            </CardTitle>
            <CardDescription>
              Name your home and list who lives there.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Home name</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Main Home"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Address label</span>
              <Input
                value={addressLabel}
                onChange={(e) => setAddressLabel(e.target.value)}
                placeholder="42 Oak Street"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Household members</span>
              <Input
                value={members}
                onChange={(e) => setMembers(e.target.value)}
                placeholder="Alex, Jordan, Sam"
              />
              <span className="text-xs text-muted-foreground">
                Comma-separated list of names.
              </span>
            </label>
            <div className="flex items-center gap-3">
              <Button onClick={saveProfile}>Save profile</Button>
              {profileSaved && (
                <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                  <Check className="size-4" /> Saved
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alert Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              Alert Settings
            </CardTitle>
            <CardDescription>
              Choose which kinds of alerts HomeOS generates for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {ALERT_FIELDS.map((field) => (
                <ToggleRow
                  key={field.key}
                  label={field.label}
                  hint={field.hint}
                  checked={settings.alerts[field.key]}
                  onToggle={() => toggleAlert(field.key)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle>Thresholds</CardTitle>
            <CardDescription>
              How far in advance warnings appear, and the high-spend limit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {THRESHOLD_FIELDS.map((field) => (
                <label key={field.key} className="block space-y-1.5">
                  <span className="text-sm font-medium">{field.label}</span>
                  <Input
                    type="number"
                    min={0}
                    defaultValue={settings[field.key]}
                    onChange={(e) => setThreshold(field.key, e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">{field.hint}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle>Data</CardTitle>
            <CardDescription>
              Reset, clear, export, or import your HomeOS data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              {admin && (
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="size-4" />
                  Reset HomeOS demo data
                </Button>
              )}
              <Button variant="destructive" onClick={handleClear}>
                <Trash2 className="size-4" />
                Clear HomeOS data
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Export</span>
                <Button variant="secondary" size="sm" onClick={handleExport}>
                  <Download className="size-4" />
                  Export JSON
                </Button>
              </div>
              <Textarea
                readOnly
                value={exported}
                placeholder="Click Export JSON to generate a copyable snapshot."
                className="min-h-[140px] font-mono text-xs"
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium">Import</span>
              <Textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportResult(null);
                }}
                placeholder="Paste exported HomeOS JSON here."
                className="min-h-[140px] font-mono text-xs"
              />
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImport}
                  disabled={importText.trim().length === 0}
                >
                  <Upload className="size-4" />
                  Import
                </Button>
                {importResult?.ok && (
                  <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                    <Check className="size-4" /> Imported successfully
                  </span>
                )}
                {importResult && !importResult.ok && (
                  <span className="text-sm text-red-600 dark:text-red-400">
                    {importResult.error ?? "Import failed."}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}

"use client";

import * as React from "react";
import {
  CalendarClock,
  CheckCircle2,
  CircleSlash,
  PauseCircle,
  PiggyBank,
  Plus,
  RotateCcw,
  Search,
  Tag,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { useHomeOS } from "@/lib/homeos/store";
import {
  getAnnualSubscriptionTotal,
  getMonthlySubscriptionTotal,
  getPotentialSavings,
  getRenewalsWithinDays,
  getTrialsEndingWithinDays,
  monthlyEquivalent,
} from "@/lib/homeos/calculations";
import { getSubscriptionRecommendation } from "@/lib/homeos/suggestions";
import { formatDate, nowIso, relativeLabel } from "@/lib/homeos/dates";
import {
  BILLING_CYCLES,
  IMPORTANCE_LEVELS,
  SUBSCRIPTION_CATEGORIES,
  SUBSCRIPTION_STATUSES,
  USAGE_LEVELS,
  type BillingCycle,
  type HomeSubscription,
  type Importance,
  type SubscriptionCategory,
  type SubscriptionStatus,
  type UsageLevel,
} from "@/lib/homeos/types";

import {
  DetailRow,
  Drawer,
  Field,
  HomeEmpty,
  Section,
  StatCard,
  StatusPill,
} from "@/components/homeos/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/components/ui/confirm";
import { cn } from "@/lib/utils";

// ---- Helpers ---------------------------------------------------------------

const money = (n: number) => `£${n.toFixed(2)}`;
const money0 = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

type StatusTone = "green" | "amber" | "red" | "blue" | "grey";

function statusTone(status: SubscriptionStatus): StatusTone {
  switch (status) {
    case "Active":
      return "green";
    case "Trial":
      return "blue";
    case "Reviewing":
    case "Cancel Soon":
      return "amber";
    case "Cancelled":
    case "Paused":
      return "grey";
    default:
      return "grey";
  }
}

type VerdictVariant = "success" | "warning" | "destructive";

function verdictVariant(verdict: string): VerdictVariant {
  switch (verdict) {
    case "Keep":
      return "success";
    case "Cancel candidate":
      return "destructive";
    default:
      return "warning";
  }
}

type SortKey =
  | "renewal"
  | "costHigh"
  | "costLow"
  | "status"
  | "usage"
  | "category";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "renewal", label: "Renewal date" },
  { value: "costHigh", label: "Cost high → low" },
  { value: "costLow", label: "Cost low → high" },
  { value: "status", label: "Status" },
  { value: "usage", label: "Usage" },
  { value: "category", label: "Category" },
];

const USAGE_RANK: Record<UsageLevel, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
  Unknown: 3,
};

const ALL = "__all__";

// ---- Main component --------------------------------------------------------

export function SubscriptionOps() {
  const {
    data,
    updateSubscription,
    deleteSubscription,
    addTodayAction,
  } = useHomeOS();

  const subscriptions = data.subscriptions;

  // Filter state -------------------------------------------------------------
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>(ALL);
  const [categoryFilter, setCategoryFilter] = React.useState<string>(ALL);
  const [ownerFilter, setOwnerFilter] = React.useState<string>(ALL);
  const [cycleFilter, setCycleFilter] = React.useState<string>(ALL);
  const [usageFilter, setUsageFilter] = React.useState<string>(ALL);
  const [importanceFilter, setImportanceFilter] = React.useState<string>(ALL);

  const [renewalsSoon, setRenewalsSoon] = React.useState(false);
  const [trialsOnly, setTrialsOnly] = React.useState(false);
  const [cancelSoon, setCancelSoon] = React.useState(false);

  const [sortKey, setSortKey] = React.useState<SortKey>("renewal");

  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Derived: list of owners present in the data, for the owner filter.
  const owners = React.useMemo(() => {
    const set = new Set<string>();
    subscriptions.forEach((s) => {
      if (s.owner && s.owner.trim()) set.add(s.owner.trim());
    });
    return Array.from(set).sort();
  }, [subscriptions]);

  // Summary metrics ----------------------------------------------------------
  const monthlyTotal = getMonthlySubscriptionTotal(subscriptions);
  const annualTotal = getAnnualSubscriptionTotal(subscriptions);
  const activeCount = subscriptions.filter((s) => s.status === "Active").length;
  const trialsEndingSoon = getTrialsEndingWithinDays(subscriptions, 7).length;
  const renewals30 = getRenewalsWithinDays(subscriptions, 30).length;
  const potentialSavings = getPotentialSavings(subscriptions);

  // Renewals-within-30 set (ids) used by the toggle filter.
  const renewalsSoonIds = React.useMemo(
    () => new Set(getRenewalsWithinDays(subscriptions, 30).map((s) => s.id)),
    [subscriptions],
  );

  // Apply filters + sort -----------------------------------------------------
  const visible = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = subscriptions.filter((s) => {
      if (q) {
        const hay = `${s.name} ${s.provider}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (statusFilter !== ALL && s.status !== statusFilter) return false;
      if (categoryFilter !== ALL && s.category !== categoryFilter) return false;
      if (ownerFilter !== ALL && (s.owner ?? "") !== ownerFilter) return false;
      if (cycleFilter !== ALL && s.billingCycle !== cycleFilter) return false;
      if (usageFilter !== ALL && s.usageLevel !== usageFilter) return false;
      if (importanceFilter !== ALL && s.importance !== importanceFilter)
        return false;

      if (renewalsSoon && !renewalsSoonIds.has(s.id)) return false;
      if (trialsOnly && s.status !== "Trial") return false;
      if (cancelSoon && s.status !== "Cancel Soon") return false;

      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case "renewal": {
          const at = a.renewalDate
            ? new Date(a.renewalDate).getTime()
            : Number.POSITIVE_INFINITY;
          const bt = b.renewalDate
            ? new Date(b.renewalDate).getTime()
            : Number.POSITIVE_INFINITY;
          return at - bt;
        }
        case "costHigh":
          return monthlyEquivalent(b) - monthlyEquivalent(a);
        case "costLow":
          return monthlyEquivalent(a) - monthlyEquivalent(b);
        case "status":
          return a.status.localeCompare(b.status);
        case "usage":
          return USAGE_RANK[a.usageLevel] - USAGE_RANK[b.usageLevel];
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
    return sorted;
  }, [
    subscriptions,
    search,
    statusFilter,
    categoryFilter,
    ownerFilter,
    cycleFilter,
    usageFilter,
    importanceFilter,
    renewalsSoon,
    trialsOnly,
    cancelSoon,
    renewalsSoonIds,
    sortKey,
  ]);

  const selected = React.useMemo(
    () => subscriptions.find((s) => s.id === selectedId) ?? null,
    [subscriptions, selectedId],
  );

  // Empty state --------------------------------------------------------------
  if (subscriptions.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <HomeEmpty message="No subscriptions yet. Add your first subscription to track renewals, trials, and spend." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Monthly spend"
          value={money0(monthlyTotal)}
          hint={money(monthlyTotal)}
          icon={Wallet}
          tone="primary"
        />
        <StatCard
          label="Annual spend"
          value={money0(annualTotal)}
          icon={TrendingUp}
        />
        <StatCard
          label="Active subs"
          value={activeCount}
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard
          label="Trials ending"
          value={trialsEndingSoon}
          hint="next 7 days"
          icon={CalendarClock}
          tone={trialsEndingSoon > 0 ? "amber" : "default"}
        />
        <StatCard
          label="Renewals 30d"
          value={renewals30}
          icon={RotateCcw}
          tone={renewals30 > 0 ? "amber" : "default"}
        />
        <StatCard
          label="Potential savings"
          value={`${money0(potentialSavings)}/mo`}
          hint={`${money(potentialSavings)}/mo`}
          icon={PiggyBank}
          tone={potentialSavings > 0 ? "green" : "default"}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or provider…"
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-7">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Status"
            >
              <option value={ALL}>All statuses</option>
              {SUBSCRIPTION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>

            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Category"
            >
              <option value={ALL}>All categories</option>
              {SUBSCRIPTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            <Select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              aria-label="Owner"
            >
              <option value={ALL}>All owners</option>
              {owners.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>

            <Select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              aria-label="Billing cycle"
            >
              <option value={ALL}>All cycles</option>
              {BILLING_CYCLES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            <Select
              value={usageFilter}
              onChange={(e) => setUsageFilter(e.target.value)}
              aria-label="Usage level"
            >
              <option value={ALL}>All usage</option>
              {USAGE_LEVELS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>

            <Select
              value={importanceFilter}
              onChange={(e) => setImportanceFilter(e.target.value)}
              aria-label="Importance"
            >
              <option value={ALL}>All importance</option>
              {IMPORTANCE_LEVELS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </Select>

            <Select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Sort"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ToggleButton
              active={renewalsSoon}
              onClick={() => setRenewalsSoon((v) => !v)}
            >
              Renewals soon
            </ToggleButton>
            <ToggleButton
              active={trialsOnly}
              onClick={() => setTrialsOnly((v) => !v)}
            >
              Trials
            </ToggleButton>
            <ToggleButton
              active={cancelSoon}
              onClick={() => setCancelSoon((v) => !v)}
            >
              Cancel soon
            </ToggleButton>

            <span className="ml-auto text-xs text-muted-foreground">
              {visible.length} of {subscriptions.length}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Section
        title="Subscriptions"
        description="Click any card to review and act."
      >
        {visible.length === 0 ? (
          <HomeEmpty message="No subscriptions match these filters." />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                onClick={() => setSelectedId(sub.id)}
              />
            ))}
          </div>
        )}
      </Section>

      <SubscriptionDrawer
        sub={selected}
        onClose={() => setSelectedId(null)}
        updateSubscription={updateSubscription}
        deleteSubscription={(id) => {
          deleteSubscription(id);
          setSelectedId(null);
        }}
        addTodayAction={addTodayAction}
      />
    </div>
  );
}

// ---- Header ----------------------------------------------------------------

function Header() {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold tracking-tight">
        SubscriptionOS
      </h2>
      <p className="text-sm text-muted-foreground">
        Track renewals, trials, contracts, and money leaks.
      </p>
    </div>
  );
}

// ---- Toggle button ---------------------------------------------------------

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </Button>
  );
}

// ---- Subscription card -----------------------------------------------------

function SubscriptionCard({
  sub,
  onClick,
}: {
  sub: HomeSubscription;
  onClick: () => void;
}) {
  const monthly = monthlyEquivalent(sub);
  const rec = getSubscriptionRecommendation(sub);

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer transition-colors hover:bg-accent/40"
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate font-semibold">{sub.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {sub.provider || "—"} · {sub.category}
            </div>
          </div>
          <StatusPill label={sub.status} tone={statusTone(sub.status)} />
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className="text-lg font-bold tracking-tight">
            {money(monthly)}
            <span className="text-xs font-normal text-muted-foreground">
              {" "}
              /mo
            </span>
          </div>
          {sub.annualCost > 0 && (
            <div className="text-xs text-muted-foreground">
              {money(sub.annualCost)}/yr
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Tag className="size-3" />
            {sub.billingCycle}
          </span>
          {sub.renewalDate && (
            <span className="inline-flex items-center gap-1">
              <RotateCcw className="size-3" />
              {relativeLabel(sub.renewalDate)}
            </span>
          )}
          {sub.trialEndDate && (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <CalendarClock className="size-3" />
              trial {relativeLabel(sub.trialEndDate)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{sub.usageLevel} usage</Badge>
          <Badge variant="secondary">{sub.importance}</Badge>
          {sub.owner && <Badge variant="outline">{sub.owner}</Badge>}
          <Badge variant={verdictVariant(rec.verdict)} className="ml-auto">
            {rec.verdict}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Drawer ----------------------------------------------------------------

function SubscriptionDrawer({
  sub,
  onClose,
  updateSubscription,
  deleteSubscription,
  addTodayAction,
}: {
  sub: HomeSubscription | null;
  onClose: () => void;
  updateSubscription: (id: string, patch: Partial<HomeSubscription>) => void;
  deleteSubscription: (id: string) => void;
  addTodayAction: ReturnType<typeof useHomeOS>["addTodayAction"];
}) {
  const confirm = useConfirm();
  const [note, setNote] = React.useState("");

  // Editable inline fields, seeded from the selected subscription.
  const [editStatus, setEditStatus] = React.useState<SubscriptionStatus>("Active");
  const [editCategory, setEditCategory] =
    React.useState<SubscriptionCategory>("Other");
  const [editCycle, setEditCycle] = React.useState<BillingCycle>("Monthly");
  const [editUsage, setEditUsage] = React.useState<UsageLevel>("Unknown");
  const [editImportance, setEditImportance] =
    React.useState<Importance>("Unknown");

  React.useEffect(() => {
    if (sub) {
      setNote(sub.notes ?? "");
      setEditStatus(sub.status);
      setEditCategory(sub.category);
      setEditCycle(sub.billingCycle);
      setEditUsage(sub.usageLevel);
      setEditImportance(sub.importance);
    }
  }, [sub]);

  if (!sub) {
    return (
      <Drawer open={false} onClose={onClose} title="">
        {null}
      </Drawer>
    );
  }

  const monthly = monthlyEquivalent(sub);
  const annual = sub.annualCost > 0 ? sub.annualCost : monthly * 12;
  const rec = getSubscriptionRecommendation(sub);

  const setStatus = (status: SubscriptionStatus) =>
    updateSubscription(sub.id, { status });

  const markReviewed = () =>
    updateSubscription(sub.id, {
      status: "Reviewing",
      lastReviewedAt: nowIso(),
    });

  const saveNote = () => updateSubscription(sub.id, { notes: note });

  const onDelete = async () => {
    if (
      await confirm({
        title: "Delete this subscription?",
        description: sub.name,
        destructive: true,
      })
    ) {
      deleteSubscription(sub.id);
    }
  };

  const pushToToday = () => {
    addTodayAction({
      title: `Review ${sub.name} subscription`,
      source: "HomeOS",
      sourceModule: "SubscriptionOps",
      linkedEntityType: "subscription",
      linkedEntityId: sub.id,
      priority: "Normal",
      estimatedMinutes: 5,
      status: "Not Started",
    });
  };

  return (
    <Drawer
      open={!!sub}
      onClose={onClose}
      title={sub.name}
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="size-4" />
            Delete
          </Button>
          <Button size="sm" onClick={pushToToday}>
            <Plus className="size-4" />
            Add to Today
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Recommendation */}
        <div className="rounded-xl border bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <Badge variant={verdictVariant(rec.verdict)}>{rec.verdict}</Badge>
            <StatusPill label={sub.status} tone={statusTone(sub.status)} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{rec.reason}</p>
        </div>

        {/* Cost breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Monthly
            </div>
            <div className="text-xl font-bold">{money(monthly)}</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Annual
            </div>
            <div className="text-xl font-bold">{money(annual)}</div>
          </div>
        </div>

        {/* Details */}
        <div className="divide-y">
          <DetailRow label="Provider" value={sub.provider || "—"} />
          <DetailRow label="Category" value={sub.category} />
          <DetailRow label="Billing cycle" value={sub.billingCycle} />
          <DetailRow label="Monthly cost" value={money(sub.monthlyCost)} />
          {sub.annualCost > 0 && (
            <DetailRow label="Annual cost" value={money(sub.annualCost)} />
          )}
          <DetailRow
            label="Renewal"
            value={
              sub.renewalDate
                ? `${formatDate(sub.renewalDate)} (${relativeLabel(sub.renewalDate)})`
                : undefined
            }
          />
          <DetailRow
            label="Trial ends"
            value={
              sub.trialEndDate
                ? `${formatDate(sub.trialEndDate)} (${relativeLabel(sub.trialEndDate)})`
                : undefined
            }
          />
          <DetailRow
            label="Contract ends"
            value={
              sub.contractEndDate ? formatDate(sub.contractEndDate) : undefined
            }
          />
          <DetailRow label="Status" value={sub.status} />
          <DetailRow label="Usage" value={sub.usageLevel} />
          <DetailRow label="Importance" value={sub.importance} />
          <DetailRow label="Owner" value={sub.owner} />
          <DetailRow label="Payment method" value={sub.paymentMethod} />
          <DetailRow
            label="Last reviewed"
            value={sub.lastReviewedAt ? formatDate(sub.lastReviewedAt) : undefined}
          />
        </div>

        {/* Quick status actions */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Quick actions</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={markReviewed}>
              <RotateCcw className="size-4" />
              Mark reviewed
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatus("Cancel Soon")}
            >
              <CalendarClock className="size-4" />
              Cancel soon
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatus("Cancelled")}
            >
              <CircleSlash className="size-4" />
              Cancelled
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatus("Active")}
            >
              <CheckCircle2 className="size-4" />
              Active
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatus("Paused")}
            >
              <PauseCircle className="size-4" />
              Pause
            </Button>
          </div>
        </div>

        {/* Inline edits */}
        <div className="space-y-3">
          <div className="text-sm font-medium">Edit</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Status">
              <Select
                value={editStatus}
                onChange={(e) => {
                  const v = e.target.value as SubscriptionStatus;
                  setEditStatus(v);
                  updateSubscription(sub.id, { status: v });
                }}
              >
                {SUBSCRIPTION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Category">
              <Select
                value={editCategory}
                onChange={(e) => {
                  const v = e.target.value as SubscriptionCategory;
                  setEditCategory(v);
                  updateSubscription(sub.id, { category: v });
                }}
              >
                {SUBSCRIPTION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Billing cycle">
              <Select
                value={editCycle}
                onChange={(e) => {
                  const v = e.target.value as BillingCycle;
                  setEditCycle(v);
                  updateSubscription(sub.id, { billingCycle: v });
                }}
              >
                {BILLING_CYCLES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Usage level">
              <Select
                value={editUsage}
                onChange={(e) => {
                  const v = e.target.value as UsageLevel;
                  setEditUsage(v);
                  updateSubscription(sub.id, { usageLevel: v });
                }}
              >
                {USAGE_LEVELS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Importance">
              <Select
                value={editImportance}
                onChange={(e) => {
                  const v = e.target.value as Importance;
                  setEditImportance(v);
                  updateSubscription(sub.id, { importance: v });
                }}
              >
                {IMPORTANCE_LEVELS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Field label="Notes">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this subscription…"
            />
          </Field>
          <Button
            variant="secondary"
            size="sm"
            onClick={saveNote}
            disabled={note === (sub.notes ?? "")}
            className={cn(note === (sub.notes ?? "") && "opacity-60")}
          >
            Save note
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

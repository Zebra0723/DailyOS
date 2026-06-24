"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Calendar,
  CheckSquare,
  Tag,
  RotateCcw,
} from "lucide-react";
import {
  approveInboxItem,
  deleteInboxItem,
  reprocessInboxItem,
  updateInboxText,
} from "@/app/(app)/inbox/actions";
import {
  ITEM_TYPE_LABELS,
  VAULT_CATEGORY_LABELS,
  type InboxItem,
  type ItemType,
  type Priority,
  type ProcessingLog,
  type VaultCategory,
} from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/badges";
import { useToast } from "@/components/ui/toast";

interface TaskDraft {
  title: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
}
interface EventDraft {
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
}

/** Convert an ISO string into the value a datetime-local input expects. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}
function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function ItemReview({
  item,
  logs,
  signedUrl,
}: {
  item: InboxItem;
  logs: ProcessingLog[];
  signedUrl: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const ai = item.raw_ai_json;
  const approved = item.status === "approved";

  const [summary, setSummary] = React.useState(item.summary ?? ai?.summary ?? "");
  const [itemType, setItemType] = React.useState<ItemType>(
    (item.item_type as ItemType) ?? ai?.item_type ?? "general",
  );
  const [category, setCategory] = React.useState<VaultCategory>(
    ai?.vault_category ?? "general",
  );
  const [tasks, setTasks] = React.useState<TaskDraft[]>(
    ai?.suggested_tasks ?? [],
  );
  const [events, setEvents] = React.useState<EventDraft[]>(
    ai?.suggested_calendar_events ?? [],
  );

  const [busy, setBusy] = React.useState(false);
  const [missingText, setMissingText] = React.useState("");

  // --- Needs-text-extraction state (file uploaded, no OCR yet) ---------------
  if (item.needs_text_extraction) {
    return (
      <div className="space-y-4">
        <Header item={item} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-5 text-amber-500" />
              Needs text to continue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We saved your file, but automatic text extraction (OCR) for PDFs
              and images isn&apos;t enabled yet. Paste the key text from the file
              below and DailyOS will do the rest.
            </p>
            {signedUrl && <FilePreview item={item} signedUrl={signedUrl} />}
            <Textarea
              className="min-h-[160px]"
              placeholder="Type or paste the important text from your file…"
              value={missingText}
              onChange={(e) => setMissingText(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                disabled={busy || !missingText.trim()}
                onClick={async () => {
                  setBusy(true);
                  await updateInboxText(item.id, missingText.trim());
                  await reprocessInboxItem(item.id);
                  toast({ variant: "success", title: "Extracted — review ready" });
                  router.refresh();
                }}
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Extract details
              </Button>
            </div>
          </CardContent>
        </Card>
        <DangerZone item={item} />
      </div>
    );
  }

  // --- Failed state ----------------------------------------------------------
  if (item.status === "failed") {
    return (
      <div className="space-y-4">
        <Header item={item} />
        <Card>
          <CardContent className="space-y-4 pt-6 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="size-6" />
            </div>
            <div>
              <p className="font-medium">We couldn&apos;t process this item</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {logs[0]?.message ?? "Something went wrong during extraction."}
              </p>
            </div>
            <Button
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await reprocessInboxItem(item.id);
                toast({ variant: "info", title: "Retrying…" });
                router.refresh();
              }}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              Try again
            </Button>
          </CardContent>
        </Card>
        {item.original_text && <OriginalContent item={item} signedUrl={signedUrl} />}
        <DangerZone item={item} />
      </div>
    );
  }

  // --- Review / approved editor ---------------------------------------------
  async function onApprove() {
    setBusy(true);
    // Normalise datetimes to proper ISO (browser tz) so stored times match
    // what the user sees in the editor.
    const toIso = (v: string | null) => {
      if (!v) return null;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d.toISOString();
    };
    const res = await approveInboxItem(item.id, {
      summary,
      itemType,
      vaultCategory: category,
      tasks: tasks.filter((t) => t.title.trim()),
      events: events
        .filter((e) => e.title.trim() && e.start_time)
        .map((e) => ({
          ...e,
          start_time: toIso(e.start_time),
          end_time: toIso(e.end_time),
        })),
    });
    setBusy(false);
    if (!res.ok) {
      toast({ variant: "error", title: "Could not save", description: res.error });
      return;
    }
    toast({
      variant: "success",
      title: approved ? "Updated" : "Added to your life admin",
      description: `${tasks.length} task(s) · ${events.length} event(s)`,
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Header item={item} />

      {approved && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 className="size-4" />
          Approved and saved to your tasks, calendar and vault. Edit below and
          update anytime.
        </div>
      )}

      {/* Summary + classification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            AI summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="min-h-[72px]"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={itemType}
                onChange={(e) => setItemType(e.target.value as ItemType)}
              >
                {Object.entries(ITEM_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Tag className="size-3.5" /> Vault category
              </Label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as VaultCategory)}
              >
                {Object.entries(VAULT_CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckSquare className="size-4 text-primary" />
            Suggested tasks
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setTasks((t) => [
                ...t,
                { title: "", description: null, due_date: null, priority: "medium" },
              ])
            }
          >
            <Plus className="size-4" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground">No tasks suggested.</p>
          )}
          {tasks.map((t, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Task title"
                  value={t.title}
                  onChange={(e) =>
                    setTasks((arr) =>
                      arr.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                    )
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTasks((arr) => arr.filter((_, j) => j !== i))}
                  aria-label="Remove task"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  type="date"
                  value={t.due_date ?? ""}
                  onChange={(e) =>
                    setTasks((arr) =>
                      arr.map((x, j) =>
                        j === i ? { ...x, due_date: e.target.value || null } : x,
                      ),
                    )
                  }
                />
                <Select
                  value={t.priority}
                  onChange={(e) =>
                    setTasks((arr) =>
                      arr.map((x, j) =>
                        j === i ? { ...x, priority: e.target.value as Priority } : x,
                      ),
                    )
                  }
                >
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                </Select>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="size-4 text-primary" />
            Suggested events
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setEvents((e) => [
                ...e,
                {
                  title: "",
                  description: null,
                  start_time: new Date().toISOString(),
                  end_time: null,
                  location: null,
                },
              ])
            }
          >
            <Plus className="size-4" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No date found in this item — add an event if you need one.
            </p>
          )}
          {events.map((ev, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Event title"
                  value={ev.title}
                  onChange={(e) =>
                    setEvents((arr) =>
                      arr.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)),
                    )
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEvents((arr) => arr.filter((_, j) => j !== i))}
                  aria-label="Remove event"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Starts</Label>
                  <Input
                    type="datetime-local"
                    value={toLocalInput(ev.start_time)}
                    onChange={(e) =>
                      setEvents((arr) =>
                        arr.map((x, j) =>
                          j === i ? { ...x, start_time: fromLocalInput(e.target.value) } : x,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Ends (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={toLocalInput(ev.end_time)}
                    onChange={(e) =>
                      setEvents((arr) =>
                        arr.map((x, j) =>
                          j === i ? { ...x, end_time: fromLocalInput(e.target.value) } : x,
                        ),
                      )
                    }
                  />
                </div>
              </div>
              <Input
                placeholder="Location (optional)"
                value={ev.location ?? ""}
                onChange={(e) =>
                  setEvents((arr) =>
                    arr.map((x, j) =>
                      j === i ? { ...x, location: e.target.value || null } : x,
                    ),
                  )
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Entities */}
      {ai && <Entities ai={ai} />}

      {/* Approve bar */}
      <div className="sticky bottom-20 z-10 flex items-center justify-between gap-3 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur md:bottom-4">
        <p className="hidden text-sm text-muted-foreground sm:block">
          Nothing is saved until you approve.
        </p>
        <div className="flex w-full gap-3 sm:w-auto">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await reprocessInboxItem(item.id);
              toast({ variant: "info", title: "Re-running AI…" });
              router.refresh();
            }}
          >
            <RotateCcw className="size-4" /> Re-run
          </Button>
          <Button className="flex-1 sm:flex-none" disabled={busy} onClick={onApprove}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            {approved ? "Update" : "Approve & save"}
          </Button>
        </div>
      </div>

      <OriginalContent item={item} signedUrl={signedUrl} />
      <ProcessingTimeline logs={logs} />
      <DangerZone item={item} />
    </div>
  );
}

function Header({ item }: { item: InboxItem }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <h1 className="text-2xl font-bold tracking-tight">{item.title}</h1>
      <StatusBadge status={item.status} />
    </div>
  );
}

function Entities({ ai }: { ai: NonNullable<InboxItem["raw_ai_json"]> }) {
  const groups: { label: string; values: string[] }[] = [
    { label: "People", values: ai.entities?.people ?? [] },
    { label: "Companies", values: ai.entities?.companies ?? [] },
    { label: "Places", values: ai.entities?.places ?? [] },
    { label: "Prices", values: ai.entities?.prices ?? [] },
    { label: "References", values: ai.entities?.reference_numbers ?? [] },
  ].filter((g) => g.values.length);

  if (!groups.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Key details</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {g.label}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {g.values.map((v, i) => (
                <span
                  key={i}
                  className="rounded-md bg-muted px-2 py-1 text-sm"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function OriginalContent({
  item,
  signedUrl,
}: {
  item: InboxItem;
  signedUrl: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Original</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {signedUrl && <FilePreview item={item} signedUrl={signedUrl} />}
        {item.original_text && (
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm text-foreground">
            {item.original_text}
          </pre>
        )}
        {!signedUrl && !item.original_text && (
          <p className="text-sm text-muted-foreground">No content stored.</p>
        )}
      </CardContent>
    </Card>
  );
}

function FilePreview({
  item,
  signedUrl,
}: {
  item: InboxItem;
  signedUrl: string;
}) {
  const isImage = (item.file_type ?? "").includes("image") ||
    /\.(png|jpe?g|gif|webp)$/i.test(item.file_name ?? "");

  return (
    <div className="space-y-2">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={signedUrl}
          alt={item.file_name ?? "Uploaded file"}
          className="max-h-80 w-auto rounded-lg border"
        />
      ) : (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <FileText className="size-5 text-muted-foreground" />
          <span className="flex-1 truncate text-sm">{item.file_name}</span>
        </div>
      )}
      <a href={signedUrl} target="_blank" rel="noreferrer">
        <Button variant="outline" size="sm">
          <Download className="size-4" /> Download original
        </Button>
      </a>
    </div>
  );
}

function ProcessingTimeline({ logs }: { logs: ProcessingLog[] }) {
  if (!logs.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Processing log</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {logs.map((l) => (
            <li key={l.id} className="flex gap-3 text-sm">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
              <div>
                <p className="font-medium capitalize">{l.status}</p>
                {l.message && (
                  <p className="text-muted-foreground">{l.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(l.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function DangerZone({ item }: { item: InboxItem }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);

  return (
    <>
      <Separator />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Delete this item and anything created from it.
        </p>
        <Button
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={busy}
          onClick={async () => {
            if (!confirm("Delete this item? This cannot be undone.")) return;
            setBusy(true);
            const res = await deleteInboxItem(item.id);
            if (res.ok) {
              toast({ variant: "success", title: "Item deleted" });
              router.push("/inbox");
            } else {
              setBusy(false);
              toast({ variant: "error", title: "Could not delete" });
            }
          }}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          Delete
        </Button>
      </div>
    </>
  );
}

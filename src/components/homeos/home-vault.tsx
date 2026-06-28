"use client";

import * as React from "react";
import { FileText, Link2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useHomeOS } from "@/lib/homeos/store";
import {
  DOCUMENT_TYPES,
  type DocumentType,
  type HomeDocument,
  type LinkedEntityType,
} from "@/lib/homeos/types";
import {
  formatDate,
  isOverdue,
  isWithinDays,
  relativeLabel,
} from "@/lib/homeos/dates";
import {
  Field,
  HomeEmpty,
  Modal,
  Section,
  StatusPill,
} from "@/components/homeos/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type NewDocument = Omit<HomeDocument, "id" | "createdAt" | "updatedAt">;

/** Linkable entity types (everything in LinkedEntityType except "document"). */
type LinkableType = Exclude<LinkedEntityType, null | "document">;

const LINK_TYPES: { value: LinkableType; label: string }[] = [
  { value: "subscription", label: "Subscription" },
  { value: "arrival", label: "Arrival" },
  { value: "roomItem", label: "Room item" },
  { value: "device", label: "Device" },
];

const LINK_TYPE_LABELS: Record<LinkableType, string> = {
  subscription: "Subscription",
  arrival: "Arrival",
  roomItem: "Room item",
  device: "Device",
};

// ---- Form state ------------------------------------------------------------

interface FormState {
  title: string;
  type: DocumentType;
  provider: string;
  date: string;
  expiryDate: string;
  fileUrl: string;
  notes: string;
  tags: string;
  linkType: LinkableType | "none";
  linkedEntityId: string;
}

function emptyForm(): FormState {
  return {
    title: "",
    type: "Receipt",
    provider: "",
    date: "",
    expiryDate: "",
    fileUrl: "",
    notes: "",
    tags: "",
    linkType: "none",
    linkedEntityId: "",
  };
}

/** An ISO string trimmed to the yyyy-mm-dd an <input type="date"> expects. */
function toDateInput(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function formFromDocument(doc: HomeDocument): FormState {
  const linkType: LinkableType | "none" =
    doc.linkedEntityType && doc.linkedEntityType !== "document"
      ? doc.linkedEntityType
      : "none";
  return {
    title: doc.title,
    type: doc.type,
    provider: doc.provider ?? "",
    date: toDateInput(doc.date),
    expiryDate: toDateInput(doc.expiryDate),
    fileUrl: doc.fileUrl ?? "",
    notes: doc.notes ?? "",
    tags: doc.tags.join(", "),
    linkType,
    linkedEntityId: linkType === "none" ? "" : doc.linkedEntityId ?? "",
  };
}

export function HomeVault() {
  const {
    data,
    addDocument,
    updateDocument,
    deleteDocument,
  } = useHomeOS();

  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<DocumentType | "all">(
    "all",
  );
  const [linkFilter, setLinkFilter] = React.useState<
    LinkableType | "none" | "all"
  >("all");
  const [expirySoon, setExpirySoon] = React.useState(false);

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [error, setError] = React.useState<string | null>(null);

  // ---- Entity options for the "Link to" selector --------------------------

  function linkOptions(type: LinkableType): { id: string; label: string }[] {
    switch (type) {
      case "subscription":
        return data.subscriptions.map((s) => ({ id: s.id, label: s.name }));
      case "arrival":
        return data.arrivals.map((a) => ({ id: a.id, label: a.title }));
      case "roomItem":
        return data.roomItems.map((r) => ({ id: r.id, label: r.name }));
      case "device":
        return data.devices.map((d) => ({ id: d.id, label: d.name }));
      default:
        return [];
    }
  }

  function resolveLinkedName(doc: HomeDocument): string | null {
    if (
      !doc.linkedEntityType ||
      doc.linkedEntityType === "document" ||
      !doc.linkedEntityId
    ) {
      return null;
    }
    const opts = linkOptions(doc.linkedEntityType);
    const match = opts.find((o) => o.id === doc.linkedEntityId);
    return match?.label ?? null;
  }

  // ---- Filtering ----------------------------------------------------------

  const documents = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.documents.filter((doc) => {
      if (q) {
        const haystack = `${doc.title} ${doc.provider ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (typeFilter !== "all" && doc.type !== typeFilter) return false;
      if (linkFilter !== "all") {
        const docLink =
          doc.linkedEntityType && doc.linkedEntityType !== "document"
            ? doc.linkedEntityType
            : "none";
        if (linkFilter === "none") {
          if (docLink !== "none") return false;
        } else if (docLink !== linkFilter) {
          return false;
        }
      }
      if (expirySoon && !isWithinDays(doc.expiryDate, 30)) return false;
      return true;
    });
  }, [data.documents, search, typeFilter, linkFilter, expirySoon]);

  // ---- Modal handlers -----------------------------------------------------

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
    setModalOpen(true);
  }

  function openEdit(doc: HomeDocument) {
    setEditingId(doc.id);
    setForm(formFromDocument(doc));
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setError(null);
  }

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleLinkTypeChange(value: LinkableType | "none") {
    setForm((prev) => ({ ...prev, linkType: value, linkedEntityId: "" }));
  }

  function handleSave() {
    const title = form.title.trim();
    if (!title) {
      setError("Please give the document a title.");
      return;
    }
    if (!form.type) {
      setError("Please choose a document type.");
      return;
    }

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const linkType: LinkableType | null =
      form.linkType === "none" ? null : form.linkType;

    const payload: NewDocument = {
      title,
      type: form.type,
      linkedEntityType: linkType,
      linkedEntityId:
        linkType && form.linkedEntityId ? form.linkedEntityId : undefined,
      provider: form.provider.trim() || undefined,
      date: form.date || undefined,
      expiryDate: form.expiryDate || undefined,
      fileUrl: form.fileUrl.trim() || undefined,
      notes: form.notes.trim() || undefined,
      tags,
    };

    if (editingId) {
      updateDocument(editingId, payload);
    } else {
      addDocument(payload);
    }
    closeModal();
  }

  function handleDelete(doc: HomeDocument) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Delete "${doc.title}"? This can't be undone.`)
    ) {
      return;
    }
    deleteDocument(doc.id);
  }

  const entityOptions =
    form.linkType !== "none" ? linkOptions(form.linkType) : [];

  // ---- Render -------------------------------------------------------------

  return (
    <Section
      title="Home Vault"
      description="Receipts, warranties, manuals, contracts, and proof — in one place."
      action={
        <Button onClick={openAdd}>
          <Plus />
          Add document
        </Button>
      }
    >
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or provider…"
            className="pl-9"
          />
        </div>

        <Select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as DocumentType | "all")
          }
          className="sm:w-44"
          aria-label="Filter by type"
        >
          <option value="all">All types</option>
          {DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>

        <Select
          value={linkFilter}
          onChange={(e) =>
            setLinkFilter(e.target.value as LinkableType | "none" | "all")
          }
          className="sm:w-44"
          aria-label="Filter by linked module"
        >
          <option value="all">All modules</option>
          {LINK_TYPES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
          <option value="none">Unlinked</option>
        </Select>

        <Button
          type="button"
          variant={expirySoon ? "default" : "outline"}
          onClick={() => setExpirySoon((v) => !v)}
        >
          Expiry soon
        </Button>
      </div>

      {/* List */}
      {documents.length === 0 ? (
        <HomeEmpty message="No documents yet. Add receipts, warranties, manuals, and contracts." />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {documents.map((doc) => {
            const linkedName = resolveLinkedName(doc);
            const overdue = isOverdue(doc.expiryDate);
            const soon = !overdue && isWithinDays(doc.expiryDate, 30);
            return (
              <Card key={doc.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate font-semibold">
                          {doc.title}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{doc.type}</Badge>
                        {doc.provider && (
                          <span className="text-sm text-muted-foreground">
                            {doc.provider}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(doc)}
                        aria-label="Edit document"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(doc)}
                        aria-label="Delete document"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Date</div>
                      <div className="font-medium">{formatDate(doc.date)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Expiry
                      </div>
                      {doc.expiryDate ? (
                        overdue ? (
                          <StatusPill
                            tone="red"
                            label={`Expired · ${relativeLabel(doc.expiryDate)}`}
                          />
                        ) : soon ? (
                          <StatusPill
                            tone="amber"
                            label={relativeLabel(doc.expiryDate)}
                          />
                        ) : (
                          <span className="font-medium">
                            {formatDate(doc.expiryDate)}
                          </span>
                        )
                      ) : (
                        <span className="font-medium">—</span>
                      )}
                    </div>
                  </div>

                  {linkedName && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Link2 className="size-3.5" />
                      <span>
                        {LINK_TYPE_LABELS[doc.linkedEntityType as LinkableType]}
                        {": "}
                        <span className="font-medium text-foreground">
                          {linkedName}
                        </span>
                      </span>
                    </div>
                  )}

                  {doc.notes && (
                    <p className="text-sm text-muted-foreground">{doc.notes}</p>
                  )}

                  {doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {doc.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {doc.fileUrl && (
                    <div className="truncate text-xs text-muted-foreground">
                      File: {doc.fileUrl}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / edit modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "Edit document" : "Add document"}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? "Save changes" : "Add document"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Field label="Title">
            <Input
              value={form.title}
              onChange={(e) => patch("title", e.target.value)}
              placeholder="e.g. Sofa receipt"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type">
              <Select
                value={form.type}
                onChange={(e) =>
                  patch("type", e.target.value as DocumentType)
                }
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Provider">
              <Input
                value={form.provider}
                onChange={(e) => patch("provider", e.target.value)}
                placeholder="e.g. John Lewis"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Date">
              <Input
                type="date"
                value={form.date}
                onChange={(e) => patch("date", e.target.value)}
              />
            </Field>

            <Field label="Expiry date">
              <Input
                type="date"
                value={form.expiryDate}
                onChange={(e) => patch("expiryDate", e.target.value)}
              />
            </Field>
          </div>

          <Field label="File URL or filename">
            <Input
              value={form.fileUrl}
              onChange={(e) => patch("fileUrl", e.target.value)}
              placeholder="e.g. receipts/sofa.pdf"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Link to">
              <Select
                value={form.linkType}
                onChange={(e) =>
                  handleLinkTypeChange(
                    e.target.value as LinkableType | "none",
                  )
                }
              >
                <option value="none">Nothing</option>
                {LINK_TYPES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </Select>
            </Field>

            {form.linkType !== "none" && (
              <Field label={LINK_TYPE_LABELS[form.linkType]}>
                <Select
                  value={form.linkedEntityId}
                  onChange={(e) => patch("linkedEntityId", e.target.value)}
                >
                  <option value="">Select…</option>
                  {entityOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </div>

          <Field label="Notes">
            <Textarea
              value={form.notes}
              onChange={(e) => patch("notes", e.target.value)}
              placeholder="Anything worth remembering…"
            />
          </Field>

          <Field label="Tags">
            <Input
              value={form.tags}
              onChange={(e) => patch("tags", e.target.value)}
              placeholder="Comma-separated, e.g. furniture, living room"
            />
            <span className={cn("text-xs text-muted-foreground")}>
              Separate tags with commas.
            </span>
          </Field>
        </div>
      </Modal>
    </Section>
  );
}

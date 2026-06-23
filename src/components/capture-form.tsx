"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, Loader2, X, Type } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createInboxItem } from "@/app/(app)/inbox/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

type Tab = "text" | "file";

const ACCEPTED = ".pdf,.png,.jpg,.jpeg,.txt";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export function CaptureForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = React.useMemo(() => createClient(), []);

  const [tab, setTab] = React.useState<Tab>("text");
  const [title, setTitle] = React.useState("");
  const [text, setText] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function onPickFile(f: File | null) {
    setError(null);
    if (!f) return setFile(null);
    if (f.size > MAX_BYTES) {
      setError("That file is larger than 10 MB.");
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function submit() {
    setError(null);

    if (tab === "text" && !text.trim()) {
      setError("Paste some text to get started, or switch to file upload.");
      return;
    }
    if (tab === "file" && !file) {
      setError("Choose a file to upload.");
      return;
    }

    setSubmitting(true);
    try {
      const combinedText = [text.trim(), notes.trim() && `Notes: ${notes.trim()}`]
        .filter(Boolean)
        .join("\n\n");

      if (tab === "text") {
        const res = await createInboxItem({
          title: title.trim() || text.slice(0, 60),
          text: combinedText,
        });
        if (!res.ok) throw new Error(res.error);
        toast({ variant: "success", title: "Captured — review ready" });
        router.push(`/inbox/${res.id}`);
        return;
      }

      // File upload path.
      const f = file!;
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("inbox-files")
        .upload(path, f, { contentType: f.type || undefined });
      if (upErr) throw new Error(upErr.message);

      // .txt files: read text here. Images & PDFs are read server-side
      // (vision OCR for images, text layer for PDFs) during extraction.
      let extractedText = notes.trim() ? `Notes: ${notes.trim()}` : "";
      if (ext === "txt") {
        const raw = await f.text();
        extractedText = [raw, extractedText].filter(Boolean).join("\n\n");
      }

      const res = await createInboxItem({
        title: title.trim() || f.name,
        text: extractedText || undefined,
        fileUrl: path,
        fileName: f.name,
        fileType: f.type || ext,
        needsTextExtraction: false,
      });
      if (!res.ok) throw new Error(res.error);

      toast({ variant: "success", title: "Captured — review ready" });
      router.push(`/inbox/${res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        <TabButton active={tab === "text"} onClick={() => setTab("text")} icon={Type}>
          Paste text
        </TabButton>
        <TabButton active={tab === "file"} onClick={() => setTab("file")} icon={Upload}>
          Upload file
        </TabButton>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          placeholder="e.g. Flight to Lisbon, Boiler warranty…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {tab === "text" ? (
        <div className="space-y-2">
          <Label htmlFor="text">Paste anything</Label>
          <Textarea
            id="text"
            className="min-h-[200px]"
            placeholder="Paste a booking confirmation, receipt, school letter, email…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      ) : (
        <FileDrop file={file} onPick={onPickFile} />
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Anything you want DailyOS to keep in mind…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={() => router.push("/inbox")} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? "Working…" : "Capture & review"}
        </Button>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Type;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {children}
    </button>
  );
}

function FileDrop({
  file,
  onPick,
}: {
  file: File | null;
  onPick: (f: File | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
        <div className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
          <FileText className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(0)} KB
          </p>
        </div>
        <button
          onClick={() => onPick(null)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Remove file"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onPick(e.dataTransfer.files?.[0] ?? null);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
        dragging ? "border-primary bg-accent" : "hover:border-primary/50",
      )}
    >
      <Upload className="size-7 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">
        Drop a file or click to browse
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        PDF, PNG, JPG or TXT · up to 10 MB
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        DailyOS reads the text from photos &amp; PDFs automatically.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

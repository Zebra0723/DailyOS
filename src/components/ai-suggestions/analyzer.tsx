"use client";

import * as React from "react";
import {
  Upload,
  FileText,
  ImageIcon,
  Loader2,
  Sparkles,
  CheckCircle2,
  X,
  RotateCcw,
  AlertTriangle,
  Reply,
  CalendarPlus,
  Trash2,
  Flame,
} from "lucide-react";
import { getAnalyzer, type AnalyzerConfig } from "@/lib/ai/analyzers";
import { getSuggestions } from "@/app/(app)/ai-suggestions/actions";
import type { SuggestionResult } from "@/lib/ai/suggest";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ACCEPTED = ".png,.jpg,.jpeg,.pdf";
const ACCEPTED_EXT = ["png", "jpg", "jpeg", "pdf"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function ext(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function fileToBase64(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(f);
  });
}

/** Reusable analyzer screen, driven entirely by an analyzer config key. */
export function ConversationAnalyzer({ channel }: { channel: string }) {
  const cfg = getAnalyzer(channel);
  if (!cfg) {
    return <p className="text-sm text-muted-foreground">Unknown analyzer.</p>;
  }
  return <AnalyzerInner cfg={cfg} />;
}

function AnalyzerInner({ cfg }: { cfg: AnalyzerConfig }) {
  const [file, setFile] = React.useState<File | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [stage, setStage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<SuggestionResult | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function pickFile(f: File | null) {
    setError(null);
    setResult(null);
    if (!f) return;
    if (!ACCEPTED_EXT.includes(ext(f.name))) {
      setError("Unsupported file. Please upload a PNG, JPG, JPEG or PDF.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("That file is larger than 10 MB. Try a smaller screenshot.");
      return;
    }
    setFile(f);
  }

  async function analyze() {
    if (!file) {
      setError("Choose a screenshot or PDF first.");
      return;
    }
    setError(null);
    setResult(null);
    const isImage = ["png", "jpg", "jpeg"].includes(ext(file.name));

    try {
      let text = "";
      let pdfBase64: string | undefined;

      if (isImage) {
        setStage(`Reading your ${cfg.channelNoun}… 0%`);
        try {
          const { recognize } = await import("tesseract.js");
          const { data } = await recognize(file, "eng", {
            logger: (m: { status: string; progress: number }) => {
              if (m.status === "recognizing text") {
                setStage(`Reading your ${cfg.channelNoun}… ${Math.round(m.progress * 100)}%`);
              }
            },
          });
          text = (data.text ?? "").replace(/\n{3,}/g, "\n\n").trim();
        } catch {
          setStage(null);
          setError(
            "We couldn't read that image. Try a clearer, well-lit screenshot.",
          );
          return;
        }
      } else {
        // PDF — extract text server-side.
        pdfBase64 = await fileToBase64(file);
      }

      setStage(`Organizing your ${cfg.channelNoun}…`);
      const res = await getSuggestions({ channel: cfg.key, text, pdfBase64 });
      setStage(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res.result);
    } catch {
      setStage(null);
      setError("Something went wrong. Please try again.");
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    setStage(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const busy = stage !== null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`OrganizerOS · ${cfg.label}`}
        description={cfg.description}
      />

      {/* Upload area */}
      {!result && (
        <Card>
          <CardContent className="pt-6">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />

            {!file ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  pickFile(e.dataTransfer.files?.[0] ?? null);
                }}
                className={cn(
                  "flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
                  dragging
                    ? "border-primary bg-accent/50"
                    : "border-input hover:border-primary/50 hover:bg-accent/30",
                )}
              >
                <div className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
                  <Upload className="size-6" />
                </div>
                <div>
                  <p className="font-medium">{cfg.uploadHint}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Drag &amp; drop, or click to choose · PNG, JPG or PDF · up to 10 MB
                  </p>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border p-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  {ext(file.name) === "pdf" ? (
                    <FileText className="size-5" />
                  ) : (
                    <ImageIcon className="size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                {!busy && (
                  <button
                    onClick={reset}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Remove file"
                  >
                    <X className="size-5" />
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              className="mt-5 w-full"
              onClick={analyze}
              disabled={!file || busy}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {busy ? stage : "Organize this"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Sparkles className="size-4 text-primary" /> OrganizerOS
            </h2>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="size-4" /> Organize another
            </Button>
          </div>

          <ResultSection
            title="Urgent"
            items={result.urgent}
            icon={Flame}
            tone="red"
          />
          <ResultSection
            title="What to include in your reply"
            items={result.reply}
            icon={Reply}
            tone="primary"
          />
          <ResultSection
            title="To do"
            items={result.todo}
            icon={CheckCircle2}
            tone="green"
          />
          <ResultSection
            title="Add to your calendar"
            items={result.calendar}
            icon={CalendarPlus}
            tone="primary"
          />
          <ResultSection
            title="Delete to save space"
            items={result.declutter}
            icon={Trash2}
            tone="muted"
          />

          {result.overall && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overall</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{result.overall}</p>
              </CardContent>
            </Card>
          )}

          {!result.usedAI && (
            <p className="text-center text-xs text-muted-foreground">
              Generated with on-device analysis. Add an AI key for richer,
              context-aware results.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({
  title,
  items,
  icon: Icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: React.ComponentType<{ className?: string }>;
  tone: "red" | "green" | "primary" | "muted";
}) {
  if (!items || items.length === 0) return null;
  const toneClass = {
    red: "text-red-500",
    green: "text-emerald-500",
    primary: "text-primary",
    muted: "text-muted-foreground",
  }[tone];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={cn("size-4", toneClass)} /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", tone === "red" ? "bg-red-400" : tone === "green" ? "bg-emerald-400" : tone === "muted" ? "bg-muted-foreground/40" : "bg-primary")} />
              {it}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

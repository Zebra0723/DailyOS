"use client";

import * as React from "react";
import { Sparkles, Loader2, Mail, MessageSquareQuote } from "lucide-react";
import { MULTIPLE_CHOICE, OPEN_ENDED, type SurveyResponse } from "@/lib/survey";
import { summarizeQuestion } from "@/app/support/survey/actions";

const ACCENT = "#bf502b";
const TRACK = "#f2e6da";

/** Relative "time ago" from a timestamp, deferred to after mount. */
function useNow() {
  const [now, setNow] = React.useState<number | null>(null);
  React.useEffect(() => setNow(Date.now()), []);
  return now;
}

function relativeDate(iso: string, now: number | null): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  if (now === null) return new Date(iso).toISOString().slice(0, 10);
  const diff = Math.max(0, now - t);
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}

const OTHER = "Other / blank";

/** Tally one multiple-choice question in canonical option order, plus an
 *  "other/blank" bucket for null or unexpected values. */
function tally(items: SurveyResponse[], key: keyof SurveyResponse, options: string[]) {
  const counts = new Map<string, number>(options.map((o) => [o, 0]));
  let other = 0;
  for (const it of items) {
    const raw = it[key];
    const v = typeof raw === "string" ? raw.trim() : "";
    if (v && counts.has(v)) counts.set(v, (counts.get(v) ?? 0) + 1);
    else other += 1;
  }
  const rows = options.map((o) => ({ label: o, count: counts.get(o) ?? 0 }));
  if (other > 0) rows.push({ label: OTHER, count: other });
  return rows;
}

function ChoiceChart({
  question,
  rows,
  total,
}: {
  question: string;
  rows: { label: string; count: number }[];
  total: number;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#1c1a17]">{question}</h3>
        <span className="shrink-0 text-xs text-[#8a8073]">
          {total} response{total === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-3 grid gap-2.5">
        {rows.map((r) => {
          const pct = total ? Math.round((r.count / total) * 100) : 0;
          const isOther = r.label === OTHER;
          return (
            <div key={r.label}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                <span className={isOther ? "text-[#8a8073]" : "text-[#4b443b]"}>{r.label}</span>
                <span className="shrink-0 tabular-nums text-[#6b6157]">
                  {r.count} · {pct}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full" style={{ background: TRACK }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(r.count / max) * 100}%`,
                    minWidth: r.count > 0 ? 4 : 0,
                    background: isOther ? "#d9c3b3" : ACCENT,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OpenEnded({
  questionKey,
  question,
  entries,
  now,
}: {
  questionKey: string;
  question: string;
  entries: { id: string; email: string | null; text: string; created_at: string }[];
  now: number | null;
}) {
  const [summary, setSummary] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function runSummary() {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const res = await summarizeQuestion(questionKey);
      if (res.ok && res.summary) setSummary(res.summary);
      else setError(res.error ?? "AI summary failed.");
    } catch {
      setError("AI summary failed — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#1c1a17]">{question}</h3>
        <span className="text-xs text-[#8a8073]">
          {entries.length} answer{entries.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-3">
        <button
          onClick={runSummary}
          disabled={loading || entries.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6ded2] bg-[#f2e6da] px-3 py-1.5 text-xs font-semibold text-[#6b4a2b] transition-colors hover:bg-[#ebd9c6] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {loading ? "Summarizing…" : "Summarize with AI"}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-[#f0c4bd] bg-[#fbe9e7] p-3 text-xs text-[#9a3412]">
          {error}
        </div>
      )}
      {summary && (
        <div className="mt-3 rounded-xl border border-[#e6ded2] bg-[#faf6ef] p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a8073]">
            <Sparkles className="size-3" style={{ color: ACCENT }} /> AI summary
          </div>
          <p className="whitespace-pre-wrap text-sm text-[#3a352e]">{summary}</p>
        </div>
      )}

      {/* Verbatim record — always visible, newest first, scrollable. */}
      <div className="mt-3 max-h-[26rem] overflow-y-auto rounded-xl border border-[#e6ded2] bg-[#faf6ef]">
        {entries.length === 0 ? (
          <div className="grid place-items-center p-6 text-center text-xs text-[#8a8073]">
            <MessageSquareQuote className="mb-1.5 size-5 text-[#c9bdae]" />
            No answers to this question yet.
          </div>
        ) : (
          <ul className="divide-y divide-[#eadfce]">
            {entries.map((e) => (
              <li key={e.id} className="p-3">
                <div className="flex items-center gap-2 text-[11px] text-[#8a8073]">
                  <Mail className="size-3 shrink-0" />
                  <span className="truncate">{e.email?.trim() || "anonymous"}</span>
                  <span className="ml-auto shrink-0">{relativeDate(e.created_at, now)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[#1c1a17]">{e.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function SurveyView({ items }: { items: SurveyResponse[] }) {
  const now = useNow();

  if (items.length === 0) {
    return (
      <p className="text-sm text-[#8a8073]">
        No survey responses yet — results will appear here as people fill out the survey.
      </p>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Multiple choice */}
      <section className="grid gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#8a8073]">
          Multiple choice
        </h2>
        {MULTIPLE_CHOICE.map((q) => (
          <ChoiceChart
            key={q.key}
            question={q.label}
            rows={tally(items, q.key, q.options)}
            total={items.length}
          />
        ))}
      </section>

      {/* Open ended */}
      <section className="grid gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#8a8073]">
          Open-ended answers
        </h2>
        {OPEN_ENDED.map((q) => {
          const entries = items
            .map((it) => {
              const raw = it[q.key];
              const text = typeof raw === "string" ? raw.trim() : "";
              return text
                ? { id: it.id, email: it.email, text, created_at: it.created_at }
                : null;
            })
            .filter((e): e is NonNullable<typeof e> => e !== null);
          return (
            <OpenEnded
              key={q.key}
              questionKey={q.key}
              question={q.label}
              entries={entries}
              now={now}
            />
          );
        })}
      </section>
    </div>
  );
}

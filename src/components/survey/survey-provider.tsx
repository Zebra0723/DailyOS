"use client";

import * as React from "react";
import { Loader2, X, Sparkles, Send, PartyPopper } from "lucide-react";
import {
  submitSurvey,
  type SurveyPayload,
} from "@/app/(app)/settings/survey-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * SurveyProvider — a small context that lets any client component (the nav
 * button, the proactive invite popup) open the same branded mini-survey modal.
 *
 *   const { openSurvey } = useSurvey();
 *   openSurvey();
 */

const STORAGE_KEY = "dailyos_survey_seen";
// When this device first opened the app — the invite waits until ~2 weeks after.
const FIRST_USE_KEY = "dailyos_first_use";
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

interface SurveyContextValue {
  openSurvey: () => void;
}

const SurveyContext = React.createContext<SurveyContextValue | null>(null);

export function useSurvey(): SurveyContextValue {
  const ctx = React.useContext(SurveyContext);
  if (!ctx) throw new Error("useSurvey must be used within <SurveyProvider>");
  return ctx;
}

// --- Survey spec (must match the admin side / DB columns) --------------------

type ChoiceKey = "q_frequency" | "q_helpful" | "q_recommend";

const CHOICE_QUESTIONS: {
  key: ChoiceKey;
  label: string;
  options: string[];
}[] = [
  {
    key: "q_frequency",
    label: "How often do you use DailyOS?",
    options: ["Daily", "A few times a week", "Occasionally", "Rarely"],
  },
  {
    key: "q_helpful",
    label: "How much has DailyOS helped with your life admin?",
    options: ["A lot", "Somewhat", "A little", "Not yet"],
  },
  {
    key: "q_recommend",
    label: "How likely are you to recommend DailyOS?",
    options: ["Very likely", "Likely", "Neutral", "Unlikely"],
  },
];

// -----------------------------------------------------------------------------

export function SurveyProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [showInvite, setShowInvite] = React.useState(false);

  const openSurvey = React.useCallback(() => {
    setShowInvite(false);
    setOpen(true);
  }, []);

  // Mark the survey as "seen" so neither the invite popup nor a fresh auto-open
  // bothers the user again (they either submitted or explicitly dismissed).
  const markSeen = React.useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  // Proactive invite: show at most once, never after it's been seen/dismissed,
  // and only once this device has ~2 weeks of usage — so we ask people who've
  // actually lived with DailyOS, not first-timers. On first ever open we just
  // record the timestamp and stay quiet.
  React.useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;

      const raw = localStorage.getItem(FIRST_USE_KEY);
      let firstUse = raw ? parseInt(raw, 10) || 0 : 0;
      if (!firstUse) {
        firstUse = Date.now();
        localStorage.setItem(FIRST_USE_KEY, String(firstUse));
      }
      // Not enough usage history yet — don't invite.
      if (Date.now() - firstUse < TWO_WEEKS_MS) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setShowInvite(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const dismissInvite = React.useCallback(() => {
    setShowInvite(false);
    markSeen();
  }, [markSeen]);

  return (
    <SurveyContext.Provider value={{ openSurvey }}>
      {children}
      {showInvite && !open && (
        <SurveyInvite onOpen={openSurvey} onDismiss={dismissInvite} />
      )}
      {open && (
        <SurveyModal
          onClose={() => setOpen(false)}
          onDone={markSeen}
          toast={toast}
        />
      )}
    </SurveyContext.Provider>
  );
}

// --- The gentle, dismissible invite card ------------------------------------

function SurveyInvite({
  onOpen,
  onDismiss,
}: {
  onOpen: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[95] ml-auto flex max-w-sm flex-col md:inset-x-auto md:bottom-4 md:left-4 md:right-auto">
      <div className="pointer-events-auto animate-fade-in rounded-xl border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Got 30 seconds?</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Help shape DailyOS with a quick 5-question survey.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" onClick={onOpen}>
                Sure, let&apos;s go
              </Button>
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- The branded survey modal ------------------------------------------------

function SurveyModal({
  onClose,
  onDone,
  toast,
}: {
  onClose: () => void;
  onDone: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [choices, setChoices] = React.useState<Record<ChoiceKey, string | null>>(
    { q_frequency: null, q_helpful: null, q_recommend: null },
  );
  const [improve, setImprove] = React.useState("");
  const [love, setLove] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const hasAny =
    Boolean(choices.q_frequency) ||
    Boolean(choices.q_helpful) ||
    Boolean(choices.q_recommend) ||
    Boolean(improve.trim()) ||
    Boolean(love.trim());

  // Escape closes the modal.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Toggle a chip: tapping the selected option again clears it (all optional).
  const pick = (key: ChoiceKey, opt: string) =>
    setChoices((c) => ({ ...c, [key]: c[key] === opt ? null : opt }));

  async function submit() {
    if (!hasAny || busy) return;
    setBusy(true);
    const payload: SurveyPayload = {
      q_frequency: choices.q_frequency,
      q_helpful: choices.q_helpful,
      q_recommend: choices.q_recommend,
      q_improve: improve,
      q_love: love,
    };
    const res = await submitSurvey(payload);
    setBusy(false);
    if (res.ok) {
      onDone();
      setDone(true);
    } else {
      toast({ variant: "error", title: "Couldn't send", description: res.error });
    }
  }

  return (
    <div
      className="fixed inset-0 z-[105] grid place-items-center bg-black/50 p-4 backdrop-blur-[1px] animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="DailyOS survey"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
              <PartyPopper className="size-7" />
            </div>
            <h2 className="font-display text-2xl font-semibold">Thank you!</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your feedback goes straight to the team and genuinely shapes what
              we build next. We appreciate you.
            </p>
            <Button className="mt-2" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold leading-snug">
                    Help shape DailyOS
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Five quick questions — answer any that apply. Thank you!
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Questions */}
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
              {CHOICE_QUESTIONS.map((q) => (
                <fieldset key={q.key}>
                  <legend className="mb-2.5 text-sm font-medium text-foreground">
                    {q.label}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt) => {
                      const active = choices[q.key] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          aria-pressed={active}
                          onClick={() => pick(q.key, opt)}
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors active:scale-[0.98]",
                            active
                              ? "border-primary bg-primary text-primary-foreground shadow-card"
                              : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}

              <div>
                <label
                  htmlFor="survey-improve"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  What&apos;s the one thing we could improve?
                </label>
                <Textarea
                  id="survey-improve"
                  value={improve}
                  onChange={(e) => setImprove(e.target.value)}
                  placeholder="The one change that would make DailyOS better for you…"
                  rows={3}
                  maxLength={2000}
                />
              </div>

              <div>
                <label
                  htmlFor="survey-love"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  What do you love most about DailyOS?
                </label>
                <Textarea
                  id="survey-love"
                  value={love}
                  onChange={(e) => setLove(e.target.value)}
                  placeholder="Tell us the part you'd miss the most…"
                  rows={3}
                  maxLength={2000}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-6 py-4">
              <Button variant="ghost" onClick={onClose}>
                Maybe later
              </Button>
              <Button onClick={submit} disabled={busy || !hasAny}>
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Send
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

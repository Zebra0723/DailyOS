// ----------------------------------------------------------------------------
// Onboarding personalisation. A short questionnaire after sign-up captures who
// the app is for, what they want help with, and the tone they like. The answers
// are saved on the user's account (auth metadata) and used to tailor the app.
// ----------------------------------------------------------------------------

export type Persona = "adult" | "family" | "student" | "kid";
export type Tone = "calm" | "warm" | "fun";

export interface Onboarding {
  persona: Persona;
  focus: string[];
  tone: Tone;
  done: boolean;
}

export const PERSONAS: { key: Persona; label: string; desc: string; emoji: string }[] = [
  { key: "adult", label: "Just me", desc: "My personal life admin", emoji: "🙂" },
  { key: "family", label: "A parent / family", desc: "Family & kids' admin", emoji: "👨‍👩‍👧" },
  { key: "student", label: "A student", desc: "Uni / school & deadlines", emoji: "🎓" },
  { key: "kid", label: "A young person", desc: "Keep it simple & fun", emoji: "🛹" },
];

export const FOCUS_OPTIONS: { key: string; label: string; emoji: string }[] = [
  { key: "money", label: "Bills & money", emoji: "💷" },
  { key: "travel", label: "Travel & bookings", emoji: "✈️" },
  { key: "school", label: "School & kids", emoji: "🎒" },
  { key: "health", label: "Health & appointments", emoji: "❤️" },
  { key: "work", label: "Work & deadlines", emoji: "💼" },
  { key: "wellbeing", label: "Staying calm", emoji: "🌊" },
  { key: "organised", label: "Just getting organised", emoji: "🗂️" },
];

export const TONES: { key: Tone; label: string; emoji: string }[] = [
  { key: "calm", label: "Calm & minimal", emoji: "🤍" },
  { key: "warm", label: "Warm & encouraging", emoji: "🌟" },
  { key: "fun", label: "Fun & playful", emoji: "🎉" },
];

const FOCUS_SUGGESTION: Record<string, { label: string; href: string }> = {
  money: { label: "Add a bill or receipt", href: "/inbox/new" },
  travel: { label: "Save a booking", href: "/inbox/new" },
  school: { label: "Add a school letter", href: "/inbox/new" },
  health: { label: "Add an appointment", href: "/calendar" },
  work: { label: "Add a task", href: "/tasks" },
  wellbeing: { label: "Take a mindful moment", href: "/mindfulness" },
  organised: { label: "Open your Inbox", href: "/inbox" },
};

/** A tailored headline + a few suggested first actions from the answers. */
export function tailoredIntro(o: Onboarding, name: string) {
  const who = name ? `, ${name}` : "";
  const headlineByPersona: Record<Persona, string> = {
    kid: `Let's make life admin easy${who}! 🎉`,
    student: `Deadlines and admin, sorted${who}.`,
    family: `Let's keep the family's admin handled${who}.`,
    adult: `Your space to get life admin handled${who}.`,
  };
  const headline =
    o.tone === "fun"
      ? `${headlineByPersona[o.persona]} 🎉`.replace(" 🎉 🎉", " 🎉")
      : headlineByPersona[o.persona];

  const suggestions = (o.focus ?? [])
    .map((f) => FOCUS_SUGGESTION[f])
    .filter(Boolean)
    .slice(0, 3);

  return { headline, suggestions };
}

export function isOnboarding(value: unknown): value is Onboarding {
  return Boolean(
    value && typeof value === "object" && (value as Onboarding).done === true,
  );
}

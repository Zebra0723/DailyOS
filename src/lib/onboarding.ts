// ----------------------------------------------------------------------------
// Onboarding personalisation. A short questionnaire after sign-up captures who
// the app is for, what they want help with, and the tone they like. The answers
// are saved on the user's account (auth metadata) and used to tailor the app.
// ----------------------------------------------------------------------------

import {
  type LucideIcon,
  User,
  Users,
  GraduationCap,
  Sparkles,
  Wallet,
  Plane,
  Backpack,
  HeartPulse,
  Briefcase,
  FolderKanban,
  Heart,
  Star,
  PartyPopper,
} from "lucide-react";

export type Persona = "adult" | "family" | "student" | "kid";
export type Tone = "calm" | "warm" | "fun";

export interface Onboarding {
  persona: Persona;
  focus: string[];
  tone: Tone;
  done: boolean;
}

export const PERSONAS: { key: Persona; label: string; desc: string; icon: LucideIcon }[] = [
  { key: "adult", label: "Just me", desc: "My personal life admin", icon: User },
  { key: "family", label: "A parent / family", desc: "Family & kids' admin", icon: Users },
  { key: "student", label: "A student", desc: "Uni / school & deadlines", icon: GraduationCap },
  { key: "kid", label: "A young person", desc: "Keep it simple & fun", icon: Sparkles },
];

export const FOCUS_OPTIONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "money", label: "Bills & money", icon: Wallet },
  { key: "travel", label: "Travel & bookings", icon: Plane },
  { key: "school", label: "School & kids", icon: Backpack },
  { key: "health", label: "Health & appointments", icon: HeartPulse },
  { key: "work", label: "Work & deadlines", icon: Briefcase },
  { key: "organised", label: "Just getting organised", icon: FolderKanban },
];

export const TONES: { key: Tone; label: string; icon: LucideIcon }[] = [
  { key: "calm", label: "Calm & minimal", icon: Heart },
  { key: "warm", label: "Warm & encouraging", icon: Star },
  { key: "fun", label: "Fun & playful", icon: PartyPopper },
];

const FOCUS_SUGGESTION: Record<string, { label: string; href: string }> = {
  money: { label: "Add a bill or receipt", href: "/inbox/new" },
  travel: { label: "Save a booking", href: "/inbox/new" },
  school: { label: "Add a school letter", href: "/inbox/new" },
  health: { label: "Add an appointment", href: "/calendar" },
  work: { label: "Add a task", href: "/tasks" },
  organised: { label: "Open the Drop", href: "/inbox" },
};

/** A tailored headline + a few suggested first actions from the answers. */
export function tailoredIntro(o: Onboarding, name: string) {
  const who = name ? `, ${name}` : "";
  const headlineByPersona: Record<Persona, string> = {
    kid: `Let's make life admin easy${who}!`,
    student: `Deadlines and admin, sorted${who}.`,
    family: `Let's keep the family's admin handled${who}.`,
    adult: `Your space to get life admin handled${who}.`,
  };
  const headline = headlineByPersona[o.persona];

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

import Link from "next/link";
import { Flower2, SmilePlus, ListChecks, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { WellbeingStreaks } from "@/components/wellbeing-streaks";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Wellbeing · DailyOS" };

const SECTIONS = [
  {
    href: "/mindfulness",
    title: "Mindfulness",
    desc: "A daily moment of calm.",
    icon: Flower2,
  },
  {
    href: "/mood",
    title: "Mood",
    desc: "A quick 1–10 check-in and your week's trend.",
    icon: SmilePlus,
  },
  {
    href: "/nudges",
    title: "Nudges",
    desc: "Gentle daily habits to tick off.",
    icon: ListChecks,
  },
];

export default function WellbeingPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Wellbeing"
        description="Life admin's calmer when you are. A few small things, just for you."
      />
      <WellbeingStreaks />
      <div className="grid gap-3">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="flex items-center gap-4 p-4 transition-colors hover:bg-accent/40">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <s.icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.title}</p>
                <p className="truncate text-sm text-muted-foreground">{s.desc}</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

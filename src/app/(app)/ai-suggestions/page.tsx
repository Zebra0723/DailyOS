import Link from "next/link";
import { Mail, MessageSquare, Sparkles, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export const metadata = { title: "AI Suggestions · DailyOS" };

const CHANNELS = [
  {
    href: "/ai-suggestions/email",
    title: "E-Mail",
    desc: "Get reply suggestions for an email conversation.",
    icon: Mail,
  },
  {
    href: "/ai-suggestions/sms",
    title: "SMS",
    desc: "Get reply suggestions for a text conversation.",
    icon: MessageSquare,
  },
];

export default function AISuggestionsPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="AI Suggestions"
        description="Upload a screenshot or PDF of a conversation and get smart suggestions for what to include in your reply."
      />
      <div className="grid gap-3">
        {CHANNELS.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="flex items-center gap-4 p-4 transition-colors hover:bg-accent/40">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                <c.icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{c.title}</p>
                <p className="truncate text-sm text-muted-foreground">{c.desc}</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </div>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Sparkles className="size-3.5" /> More channels (WhatsApp, letters…) coming soon.
      </p>
    </div>
  );
}

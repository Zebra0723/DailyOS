import Link from "next/link";
import { Mail, Inbox, MessageCircle, MessageSquare, Sparkles, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export const metadata = { title: "OrganizerOS · DailyOS" };

const CHANNELS = [
  { href: "/ai-suggestions/gmail", title: "Gmail", desc: "Sort your Gmail — urgent, to-dos, calendar, clutter.", icon: Mail },
  { href: "/ai-suggestions/applemail", title: "Apple Mail", desc: "Sort Apple Mail — urgent, to-dos, calendar, clutter.", icon: Inbox },
  { href: "/ai-suggestions/whatsapp", title: "WhatsApp", desc: "What needs a reply, what's urgent, what to diarise.", icon: MessageCircle },
  { href: "/ai-suggestions/sms", title: "SMS", desc: "What needs a reply, what's urgent, what to diarise.", icon: MessageSquare },
];

export default function OrganizerOSPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="OrganizerOS"
        description="Upload a screenshot or PDF of your inbox or a conversation, and OrganizerOS tells you what to do, what's urgent, what to put in your calendar, and what to delete to save space."
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
        <Sparkles className="size-3.5" /> Upload-based for now — live account connection needs a backend.
      </p>
    </div>
  );
}

import Link from "next/link";
import {
  LifeBuoy,
  MessageCircle,
  Mail,
  ArrowRight,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL, ENQUIRIES_EMAIL } from "@/lib/contact";

export const metadata = {
  title: "Contact us · DailyOS",
  description: "Get in touch with the DailyOS team — support and general enquiries.",
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container flex h-16 items-center">
        <Link href="/">
          <Logo tagline />
        </Link>
      </header>

      <main className="container flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          {/* Hero */}
          <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-accent/40 to-background p-8 text-center sm:p-12">
            <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MessageCircle className="size-7" />
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Get in touch
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Real people, ready to help. Whether something&apos;s not working or
              you just want to say hello, we&apos;d love to hear from you.
            </p>
          </div>

          {/* Two contact cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <ContactCard
              icon={LifeBuoy}
              title="Support"
              blurb="Something not working, or need a hand? We'll help you get unstuck."
              email={SUPPORT_EMAIL}
              subject="DailyOS support"
            />
            <ContactCard
              icon={Mail}
              title="General enquiries"
              blurb="Feedback, ideas, partnerships or press — anything else at all."
              email={ENQUIRIES_EMAIL}
              subject="DailyOS enquiry"
            />
          </div>

          {/* Reassurances */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
              <Clock className="size-5 shrink-0 text-primary" />
              We aim to reply within 2 working days.
            </div>
            <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
              <ShieldCheck className="size-5 shrink-0 text-primary" />
              Manage or delete your data any time in{" "}
              <Link href="/settings" className="text-primary hover:underline">
                Settings
              </Link>
              .
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Looking for our policies? See the{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            ,{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/cookies" className="text-primary hover:underline">
              Cookie Policy
            </Link>
            .
          </p>
        </div>
      </main>

      <footer className="container flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-6 text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-foreground">
          Terms
        </Link>
        <Link href="/cookies" className="hover:text-foreground">
          Cookies
        </Link>
        <span>© 2026 DailyOS</span>
      </footer>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  title,
  blurb,
  email,
  subject,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  blurb: string;
  email: string;
  subject: string;
}) {
  return (
    <div className="flex flex-col rounded-3xl border bg-card p-6 shadow-card">
      <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <h2 className="mt-4 font-display text-xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">{blurb}</p>

      <div className="mt-5">
        {email ? (
          <Button asChild className="w-full">
            <a href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}>
              <Mail className="size-4" /> {email}
              <ArrowRight className="size-4" />
            </a>
          </Button>
        ) : (
          // Empty slot, waiting for the inbox to be created.
          <div className="rounded-xl border border-dashed bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
            Email address coming soon
          </div>
        )}
      </div>
    </div>
  );
}

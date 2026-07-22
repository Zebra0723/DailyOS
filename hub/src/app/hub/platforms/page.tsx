import { ArrowUpRight } from "lucide-react";
import { platforms } from "@/lib/hub";

export const dynamic = "force-dynamic";

const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";

/** What each platform is really for, and what still can only be done there. */
const NOTES: Record<string, { what: string; needs: string }> = {
  "DailyOS (live app)": { what: "The product your users actually open every day.", needs: "Nothing to manage here — this is the front door." },
  Supabase: { what: "Postgres database, auth and file storage behind DailyOS.", needs: "Billing, database backups and service-role secrets." },
  Vercel: { what: "Hosts every deployment and serves the apps.", needs: "Billing, custom domains and environment variables." },
  "Groq console": { what: "The LLM inference the assistant runs on.", needs: "API keys and usage/rate-limit billing." },
  "Claude Code": { what: "Where these admin apps get built and changed.", needs: "Your Anthropic account and build credits." },
};

export default async function PlatformsPage() {
  const plats = platforms();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Platforms</h1>
        <p className="text-sm text-[#6b6157]">The external services behind DailyOS — one tap out to each real dashboard.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        {plats.map((p) => {
          const note = NOTES[p.label];
          return (
            <a
              key={p.label}
              href={p.href}
              target="_blank"
              rel="noreferrer"
              className={`${card} transition-colors hover:border-[#d9a38f]`}
            >
              <div className="flex items-center gap-1.5 font-semibold">
                {p.label}
                <ArrowUpRight className="size-3.5 text-[#a89b8a]" />
                <span className="ml-auto text-[11px] font-medium text-[#8a8073]">{p.hint}</span>
              </div>
              {note && (
                <>
                  <p className="mt-1 text-xs text-[#6b6157]">{note.what}</p>
                  <p className="mt-2 text-[11px] text-[#a89b8a]">
                    <span className="font-semibold text-[#8a8073]">Still requires it:</span> {note.needs}
                  </p>
                </>
              )}
            </a>
          );
        })}
      </section>

      <p className="text-xs text-[#a89b8a]">
        These are the things the admin apps can&rsquo;t do on their own — billing, secrets and platform-level setup live here.
      </p>
    </div>
  );
}

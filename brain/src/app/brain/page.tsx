import { CheckCircle2, XCircle, Gauge, Eye } from "lucide-react";
import { aiInfo } from "@/lib/ai";
import { getAIConfig } from "./actions";
import { BASE_PERSONA } from "@/lib/persona";
import { QuickTest } from "@/components/quick-test";
import { card } from "@/components/brain-ui";

export const dynamic = "force-dynamic";

/** Friendly provider name inferred from the endpoint host. */
function providerName(host: string): string {
  const h = host.toLowerCase();
  if (h.includes("groq")) return "Groq";
  if (h.includes("openai")) return "OpenAI";
  if (h.includes("anthropic")) return "Anthropic";
  if (h.includes("together")) return "Together";
  if (h.includes("mistral")) return "Mistral";
  return host;
}

function Row({ ok, label, value }: { ok?: boolean; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok === undefined ? <span className="size-4" /> : ok ? <CheckCircle2 className="size-4 text-emerald-600" /> : <XCircle className="size-4 text-[#c0392b]" />}
      <span className="flex-1">{label}</span>
      <span className="font-medium text-[#4b443b]">{value}</span>
    </div>
  );
}

export default async function BrainOverviewPage() {
  const info = aiInfo();
  const config = await getAIConfig();
  const ok = info.keyPresent && !info.looksLikeSupabase;
  const override = config.systemPromptOverride.trim();

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Gauge className="size-6 text-[#bf502b]" /> Overview</h1>
        <p className="text-sm text-[#6b6157]">Current status of the DailyOS AI and the prompt it actually runs with.</p>
      </div>

      <section className={card}>
        <h2 className="mb-2 text-base font-bold">AI status</h2>
        <div className="grid gap-2 text-sm">
          <Row ok={ok} label="API key" value={info.looksLikeSupabase ? "wrong key (sb_…)" : info.keyPresent ? "set" : "missing"} />
          <Row label="Provider" value={providerName(info.host)} />
          <Row label="Model" value={config.model} />
          <Row label="Host" value={info.host} />
        </div>
      </section>

      <section className={card}>
        <div className="flex items-center gap-2"><Eye className="size-4 text-[#bf502b]" /><h2 className="text-base font-bold">Effective prompt preview</h2></div>
        <p className="mt-1 text-sm text-[#6b6157]">What the assistant actually receives: the base persona plus your saved override. Edit the override under Instructions. The base persona below is representative.</p>
        <div className="mt-2 grid gap-2">
          <div className="rounded-lg border border-[#e6ded2] bg-[#faf7f1] p-2.5 text-sm text-[#4b443b]">
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#8a7f70]">Base persona (preview)</div>
            <div className="whitespace-pre-wrap">{BASE_PERSONA}</div>
          </div>
          <div className="rounded-lg border border-[#f2e6da] bg-[#faf7f1] p-2.5 text-sm text-[#4b443b]">
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-[#bf502b]">Your override</div>
            <div className="whitespace-pre-wrap">{override || "(none — default behaviour)"}</div>
          </div>
        </div>
      </section>

      <QuickTest />
    </div>
  );
}

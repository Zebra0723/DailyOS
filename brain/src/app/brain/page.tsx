import { CheckCircle2, XCircle } from "lucide-react";
import { aiInfo } from "@/lib/ai";
import { getAIConfig } from "./actions";
import { AiConsole } from "@/components/ai-console";

export const dynamic = "force-dynamic";

const card = "rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4";

export default async function BrainPage() {
  const info = aiInfo();
  const { systemPromptOverride } = await getAIConfig();
  const ok = info.keyPresent && !info.looksLikeSupabase;

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Assistant</h1>
        <p className="text-sm text-[#6b6157]">Control and test the DailyOS AI.</p>
      </div>

      <section className={card}>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            {ok ? <CheckCircle2 className="size-4 text-emerald-600" /> : <XCircle className="size-4 text-[#c0392b]" />}
            <span className="flex-1">API key</span>
            <span className="font-medium text-[#4b443b]">{info.looksLikeSupabase ? "wrong key (sb_…)" : info.keyPresent ? "set" : "missing"}</span>
          </div>
          <div className="flex items-center gap-2"><span className="size-4" /><span className="flex-1">Model</span><span className="font-medium text-[#4b443b]">{info.model}</span></div>
          <div className="flex items-center gap-2"><span className="size-4" /><span className="flex-1">Host</span><span className="font-medium text-[#4b443b]">{info.host}</span></div>
        </div>
      </section>

      <AiConsole initialOverride={systemPromptOverride} />
    </div>
  );
}

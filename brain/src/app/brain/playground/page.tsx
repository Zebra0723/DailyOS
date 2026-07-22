import { MessagesSquare } from "lucide-react";
import { getAIConfig } from "../actions";
import { Playground } from "@/components/playground";

export const dynamic = "force-dynamic";

export default async function PlaygroundPage() {
  const config = await getAIConfig();
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><MessagesSquare className="size-6 text-[#bf502b]" /> Playground</h1>
        <p className="text-sm text-[#6b6157]">Hold a real multi-turn conversation with the assistant to test tone, latency, and token usage.</p>
      </div>
      <Playground defaultTemperature={config.temperature} override={config.systemPromptOverride} />
    </div>
  );
}

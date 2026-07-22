import { Boxes } from "lucide-react";
import { getAIConfig } from "../actions";
import { ModelsBrowser } from "@/components/models-browser";

export const dynamic = "force-dynamic";

export default async function ModelsPage() {
  const config = await getAIConfig();
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Boxes className="size-6 text-[#bf502b]" /> Models</h1>
        <p className="text-sm text-[#6b6157]">Browse the models your provider exposes and choose which one the assistant runs.</p>
      </div>
      <ModelsBrowser config={config} />
    </div>
  );
}

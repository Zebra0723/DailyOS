import { FileText } from "lucide-react";
import { getAIConfig } from "../actions";
import { InstructionsEditor } from "@/components/instructions-editor";

export const dynamic = "force-dynamic";

export default async function InstructionsPage() {
  const config = await getAIConfig();
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><FileText className="size-6 text-[#bf502b]" /> Instructions</h1>
        <p className="text-sm text-[#6b6157]">Shape how the assistant behaves. Edit the override, apply a built-in style, or manage your saved presets.</p>
      </div>
      <InstructionsEditor initialOverride={config.systemPromptOverride} initialPresets={config.presets} />
    </div>
  );
}

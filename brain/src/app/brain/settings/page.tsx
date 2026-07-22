import { SlidersHorizontal } from "lucide-react";
import { getAIConfig } from "../actions";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const config = await getAIConfig();
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold"><SlidersHorizontal className="size-6 text-[#bf502b]" /> Settings</h1>
        <p className="text-sm text-[#6b6157]">Tune the model, sampling temperature, and provider endpoint. Saved to ai_config; unset values fall back to env defaults.</p>
      </div>
      <SettingsForm config={config} />
    </div>
  );
}

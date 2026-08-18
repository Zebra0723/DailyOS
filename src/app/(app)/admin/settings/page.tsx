import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-user";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUser(user)) redirect("/today");

  const admin = createServiceClient();
  const { data } = await admin
    .from("app_config")
    .select("value")
    .eq("key", "global")
    .maybeSingle();

  const cfg = (data?.value ?? {}) as {
    announcement?: string;
    maintenance?: boolean;
  };

  return (
    <SettingsForm
      announcement={cfg.announcement ?? ""}
      maintenance={Boolean(cfg.maintenance)}
    />
  );
}

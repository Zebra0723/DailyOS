import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { VaultBrowser } from "@/components/vault-browser";

export const metadata = { title: "Vault · DailyOS" };

export default async function VaultPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("vault_items")
    .select("*, inbox_items(input_type, file_name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Vault"
        description="A calm, searchable home for everything you've processed."
      />
      <VaultBrowser items={(data ?? []) as never} />
    </div>
  );
}

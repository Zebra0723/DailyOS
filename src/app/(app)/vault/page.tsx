import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { VaultBrowser } from "@/components/vault-browser";
import { ProGate } from "@/components/pro-gate";

export const metadata = { title: "Vault · DailyOS" };

export default async function VaultPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
      <ProGate
        feature="Vault"
        userId={user?.id}
        blurb="Keep every processed item filed and searchable. Unlock the Vault on Plus or Pro."
      >
        <VaultBrowser items={(data ?? []) as never} />
      </ProGate>
    </div>
  );
}

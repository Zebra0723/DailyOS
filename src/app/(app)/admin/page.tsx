import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai/provider";
import { AdminConsole } from "@/components/admin-console";
import { APP_VERSION } from "@/lib/version";

export const metadata = { title: "Testing console · DailyOS" };

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Server-only: whether a real AI provider key is configured in this env.
  const aiConfigured = getAIProvider().isConfigured();

  return (
    <AdminConsole
      userId={user?.id}
      email={user?.email ?? "you@dailyos.app"}
      aiConfigured={aiConfigured}
      version={APP_VERSION}
    />
  );
}

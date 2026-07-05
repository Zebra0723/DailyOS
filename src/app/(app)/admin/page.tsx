import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai/provider";
import { emailConfigured } from "@/lib/email";
import { AdminConsole } from "@/components/admin-console";
import { APP_VERSION } from "@/lib/version";

export const metadata = { title: "Testing console · DailyOS" };

/** Does a table exist / is it reachable? Used to show migration status. */
async function tableReady(name: string): Promise<boolean> {
  try {
    const admin = createServiceClient();
    const { error } = await admin.from(name).select("*").limit(1);
    return !error;
  } catch {
    return false;
  }
}

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Server-only: whether a real AI provider key is configured in this env.
  const aiConfigured = getAIProvider().isConfigured();

  const [referralsReady, subscriptionsReady] = await Promise.all([
    tableReady("referrals"),
    tableReady("subscriptions"),
  ]);

  return (
    <AdminConsole
      userId={user?.id}
      email={user?.email ?? "you@example.com"}
      aiConfigured={aiConfigured}
      version={APP_VERSION}
      setup={{
        aiConfigured,
        emailConfigured: emailConfigured(),
        referralsReady,
        subscriptionsReady,
      }}
    />
  );
}

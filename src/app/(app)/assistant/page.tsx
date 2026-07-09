import { createClient } from "@/lib/supabase/server";
import { AssistantChat } from "@/components/assistant-chat";
import { ProGate } from "@/components/pro-gate";

export const metadata = { title: "Ask DailyOS · DailyOS" };
// The assistant's AI call can take a little longer than inbox extraction —
// and longer still when it does a web search then answers (two model turns).
export const maxDuration = 60;

export default async function AssistantPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-2xl">
      <ProGate
        feature="Ask DailyOS"
        tier="Pro"
        userId={user?.id}
        blurb="Your AI chief of staff — ask about your day, and it reads your tasks, events and notes to give bespoke answers and file things for you."
      >
        <AssistantChat />
      </ProGate>
    </div>
  );
}

import { AssistantChat } from "@/components/assistant-chat";

export const metadata = { title: "Ask DailyOS · DailyOS" };
// The assistant's AI call can take a little longer than inbox extraction.
export const maxDuration = 30;

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <AssistantChat />
    </div>
  );
}

import { PageHeader } from "@/components/page-header";
import { NudgesList } from "@/components/nudges-list";

export const metadata = { title: "Nudges · DailyOS" };

export default function NudgesPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Nudges"
        description="Gentle little habits for a kinder day. Tick them off as you do them."
      />
      <NudgesList />
    </div>
  );
}

import { PageHeader } from "@/components/page-header";
import { MoodCheckin } from "@/components/mood-checkin";

export const metadata = { title: "Mood · DailyOS" };

export default function MoodPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Mood"
        description="A quick daily check-in. Drag the slider to how you're feeling."
      />
      <MoodCheckin />
    </div>
  );
}

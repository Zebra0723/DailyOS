import { PageHeader } from "@/components/page-header";
import { MindfulnessBox } from "@/components/mindfulness-box";

export const metadata = { title: "Mindfulness · DailyOS" };

export default function MindfulnessPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Mindfulness"
        description="Life admin, handled — now take a breath. One small moment of calm each day."
      />
      <MindfulnessBox />

      <div className="relative z-10 mt-6 rounded-xl border bg-card/80 p-5 text-sm text-muted-foreground backdrop-blur">
        <p className="font-medium text-foreground">Why this is here</p>
        <p className="mt-1">
          Sorting your life admin is calmer when you are. A 60-second reset —
          breathing, a stretch, a little gratitude — makes the to-do list feel
          lighter. Tick today&apos;s off and watch the screen settle.
        </p>
      </div>
    </div>
  );
}

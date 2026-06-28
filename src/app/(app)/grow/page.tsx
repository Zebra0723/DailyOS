import { PageHeader } from "@/components/page-header";
import { GrowPlant } from "@/components/grow-plant";

export const metadata = { title: "Grow a Plant · DailyOS" };

export default function GrowPage() {
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Grow a Plant"
        description="Press and hold to grow a sunflower. A tiny, calming moment — once a day."
      />
      <GrowPlant />

      <div className="mt-6 rounded-xl border bg-card/80 p-5 text-sm text-muted-foreground backdrop-blur">
        <p className="font-medium text-foreground">How it works</p>
        <p className="mt-1">
          Press and hold anywhere on the scene and watch your sunflower grow. Let
          go and it eases back — so stay with it. When it blooms, the sun comes
          out and your flower turns to greet you. One plant a day. 🌻
        </p>
      </div>
    </div>
  );
}

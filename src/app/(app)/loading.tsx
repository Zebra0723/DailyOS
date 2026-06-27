import { Loader2 } from "lucide-react";
import { LogoMark } from "@/components/logo";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center animate-fade-in">
      <LogoMark className="size-14" />
      <p className="text-xl font-semibold tracking-tight">
        DailyOS, your future, organised.
      </p>
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}

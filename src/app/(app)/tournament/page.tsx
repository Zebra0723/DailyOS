import { redirect } from "next/navigation";
import { getActiveTournament } from "@/lib/tournament";
import { TournamentView } from "@/components/tournament-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tournament · DailyOS" };

export default function TournamentPage() {
  const t = getActiveTournament();
  // No tournament on right now → send back to Today rather than show an empty hub.
  if (!t) redirect("/today");
  return <TournamentView tournament={t} />;
}

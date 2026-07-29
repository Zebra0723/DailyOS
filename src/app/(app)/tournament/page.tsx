import { redirect } from "next/navigation";
import { loadActiveTournament } from "@/lib/tournament-live";
import { TournamentView } from "@/components/tournament-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tournament · DailyOS" };

export default async function TournamentPage() {
  const t = await loadActiveTournament();
  // No tournament on right now → send back to Today rather than show an empty hub.
  if (!t) redirect("/today");
  return <TournamentView tournament={t} live={Boolean(t.live)} />;
}

import type { Metadata } from "next";
import { LeagueView } from "@/components/league-view";
import { RoundList } from "@/components/round-list";
import { loadLeague } from "@/db/queries";

export const metadata: Metadata = { title: "Liga Profesional" };

export default async function LigaProfesional() {
  const { tabs, latest, next } = await loadLeague("liga-profesional");

  if (!tabs.length) {
    return <p className="p-4">Todavía no hay partidos cargados de esta temporada.</p>;
  }
  return (
    <LeagueView tabs={tabs}>
      <aside className="wide:pt-16">
        {next && <RoundList round={next} />}
        {latest && <RoundList round={latest} />}
      </aside>
    </LeagueView>
  );
}

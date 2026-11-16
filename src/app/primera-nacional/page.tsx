import type { Metadata } from "next";
import { LeagueView } from "@/components/league-view";
import { RoundList } from "@/components/round-list";
import { loadLeague } from "@/db/queries";

export const metadata: Metadata = { title: "Primera Nacional" };

export default async function PrimeraNacional() {
  const { tabs, latest, next } = await loadLeague("primera-nacional");

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

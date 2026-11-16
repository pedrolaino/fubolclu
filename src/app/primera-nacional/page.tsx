import type { Metadata } from "next";
import { LeagueView } from "@/components/league-view";
import { RoundList } from "@/components/round-list";
import { loadLeague } from "@/db/queries";
import { EmptyPage } from "@/components/empty-page";

export const metadata: Metadata = { title: "Primera Nacional" };

export default async function PrimeraNacional() {
  const { tabs, latest, next } = await loadLeague("primera-nacional");

  if (!tabs.length) {
    return (
      <EmptyPage title="Primera Nacional">
        Todavía no hay partidos cargados de esta temporada.
      </EmptyPage>
    );
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

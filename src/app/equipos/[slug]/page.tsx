import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FixtureList } from "@/components/fixture-list";
import { Hero } from "@/components/hero";
import { PositionChart } from "@/components/position-chart";
import { TeamAside } from "@/components/team-aside";
import { loadTeam, teamSlugs } from "@/db/team";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return teamSlugs();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const view = await loadTeam((await params).slug);
  return { title: view?.team.name };
}

export default async function Team({ params }: Props) {
  const view = await loadTeam((await params).slug);
  if (!view) notFound();
  const { team, standing, scorers, upcoming, results } = view;

  return (
    <div style={{ "--lead": team.lead } as React.CSSProperties}>
      <Hero subject={team} title={team.name} summary={view.summary} shareCrest />
      <main
        className={`mx-auto grid max-w-[1200px] gap-10 px-4 pt-9 pb-20 ${
          standing && scorers ? "wide:grid-cols-[minmax(0,1fr)_340px] wide:gap-14" : ""
        }`}
      >
        <div>
          {standing && standing.history.length > 0 && (
            <section className="mb-11">
              <div className="flex items-end gap-4">
                <p className="display text-[72px]" aria-hidden>
                  {standing.position}º
                </p>
                <div className="pb-1">
                  <h2 className="display text-[40px]">Posición por fecha</h2>
                  <p className="mt-1 text-sm text-mute">
                    Puesto {standing.position} de {standing.size} en {standing.zone}.
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <PositionChart standing={standing} />
              </div>
              {standing.spots && standing.lineNote && (
                <p className="mt-3 text-sm font-semibold">{standing.lineNote}</p>
              )}
            </section>
          )}
          {upcoming.length > 0 && <FixtureList title="Próximos partidos" fixtures={upcoming} />}
          {results.length > 0 && <FixtureList title="Resultados" fixtures={results} />}
        </div>
        {standing && scorers && <TeamAside standing={standing} scorers={scorers} />}
      </main>
    </div>
  );
}

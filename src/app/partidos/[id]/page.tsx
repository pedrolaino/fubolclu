import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Crest } from "@/components/crest";
import { Hero } from "@/components/hero";
import { StatBars } from "@/components/stat-bars";
import { Timeline } from "@/components/timeline";
import { loadMatch, sampleMatchIds } from "@/db/match";
import type { TeamView } from "@/lib/league";

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const ids = await sampleMatchIds(8);
  // The build needs at least one; with an empty database "0" just renders the 404.
  return ids.length ? ids.map((id) => ({ id: String(id) })) : [{ id: "0" }];
}

async function load({ params }: Props) {
  const { id } = await params;
  const n = Number(id);
  return /^\d+$/.test(id) && Number.isSafeInteger(n) ? loadMatch(n) : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const view = await load(props);
  return { title: view && `${view.home.name} contra ${view.away.name}` };
}

function Side({ team, right }: { team: TeamView; right?: boolean }) {
  return (
    <Link
      href={`/equipos/${team.slug}`}
      className={`flex flex-col items-center gap-2 text-center text-xl font-semibold hover:underline wide:gap-4 ${
        right ? "wide:flex-row" : "wide:flex-row-reverse wide:text-right"
      }`}
    >
      <Crest team={team} size={56} />
      <span>{team.name}</span>
    </Link>
  );
}

export default async function Match(props: Props) {
  const view = await load(props);
  if (!view) notFound();
  const { home, away, events, stats } = view;
  const noEvents = view.finished && !view.awaitingDetails && events.length === 0;

  return (
    <div style={{ "--lead": home.lead } as React.CSSProperties}>
      <Hero subject={home} title={view.title} summary={view.summary} />
      <main
        className={`mx-auto grid max-w-[1200px] gap-10 px-4 pt-9 pb-20 ${
          stats.length ? "wide:grid-cols-[minmax(0,1fr)_340px] wide:gap-14" : ""
        }`}
      >
        <div>
          <div className="mb-11 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <Side team={home} />
            <span className="text-mute">contra</span>
            <Side team={away} right />
          </div>
          {view.awaitingDetails && <p>Todavía no cargamos el detalle de este partido.</p>}
          {noEvents && <p>No se registraron goles, tarjetas ni cambios en este partido.</p>}
          {events.length > 0 && (
            <section>
              <h2 className="display mb-2.5 text-[40px]">Cómo fue</h2>
              <Timeline events={events} homeName={home.name} awayName={away.name} />
            </section>
          )}
        </div>
        {stats.length > 0 && (
          <aside className="wide:pt-16">
            <h2 className="display mb-2.5 text-[40px]">Estadísticas</h2>
            <StatBars rows={stats} />
          </aside>
        )}
      </main>
    </div>
  );
}

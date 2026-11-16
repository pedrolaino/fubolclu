import Link from "next/link";
import {
  CupRound,
  h2,
  MatchDays,
  SeasonStrip,
  TopScorers,
  ZoneLeader,
  ZoneTable,
} from "@/components/front-page";
import { Hero } from "@/components/hero";
import { loadCup } from "@/db/cup";
import { loadFrontPage } from "@/db/front-page";
import { loadLeague } from "@/db/queries";
import { loadSeasonMap } from "@/db/season-map";
import type { Tab } from "@/lib/league";
import { paintStyle } from "@/lib/paint";

const seatKeys = [
  "campeon-apertura",
  "campeon-clausura",
  "campeon-liga",
  "copa-argentina",
  "descenso-anual",
  "descenso-promedio",
];

const zones = (tabs: Tab[]) =>
  tabs.filter((t) => t.kind === "table" && t.key.startsWith("zona-")) as (Tab & {
    kind: "table";
  })[];

export default async function Home() {
  const [front, liga, nacional, cup, map] = await Promise.all([
    loadFrontPage(),
    loadLeague("liga-profesional"),
    loadLeague("primera-nacional"),
    loadCup(),
    loadSeasonMap(),
  ]);

  // With no knockout news this week, the page belongs to the leader of the annual table.
  const hero = front.lead ?? liga.tabs.find((t) => t.key === "anual");
  if (!hero) return <p className="p-4">Todavía no hay partidos cargados de esta temporada.</p>;

  const ligaZones = zones(liga.tabs);
  const scorers = liga.tabs.find((t) => t.kind === "scorers");
  const seats = map ? seatKeys.flatMap((k) => map.seats.filter((s) => s.key === k)) : [];
  const cupRound = cup?.rounds.at(-1);
  const cupLine = map?.seats.find((s) => s.key === "copa-argentina")?.line;

  return (
    <div style={paintStyle(hero.subject)}>
      <Hero subject={hero.subject} title={hero.title} summary={hero.summary} />
      <main className="mx-auto max-w-[1200px] px-4 pt-9 pb-20">
        <div className="grid gap-14 wide:grid-cols-[minmax(0,1fr)_340px]">
          <MatchDays
            title="Lo que viene"
            side={front.upcoming}
            empty="No hay partidos en los próximos 7 días."
          />
          <div className="wide:pt-16">
            <MatchDays
              title="Lo último"
              side={front.results}
              empty="No se jugó ningún partido en los últimos 4 días."
            />
          </div>
        </div>

        {ligaZones.length > 0 && (
          <section className="mt-20 wide:mt-28">
            <h2 className={h2}>
              <Link href="/liga-profesional" className="hover:underline">
                Liga Profesional
              </Link>
            </h2>
            <div className="mt-6 grid gap-14 wide:grid-cols-[minmax(0,1fr)_340px]">
              <div>
                <div className="grid gap-10 wide:grid-cols-2 wide:gap-8">
                  {ligaZones.map((t) => (
                    <ZoneTable
                      key={t.key}
                      title={t.label}
                      href={`/liga-profesional#${t.key}`}
                      rows={t.rows}
                      lines={t.lines}
                    />
                  ))}
                </div>
                {ligaZones[0].notes.map((note) => (
                  <p key={note} className="mt-3 text-sm font-semibold">
                    {note}
                  </p>
                ))}
              </div>
              {scorers?.kind === "scorers" && (
                <TopScorers rows={scorers.rows.slice(0, 5)} note={scorers.notes[0]} />
              )}
            </div>
          </section>
        )}

        {seats.length > 0 && (
          <div className="mt-20 wide:mt-32">
            <SeasonStrip seats={seats} notes={map?.notes ?? []} />
          </div>
        )}

        <div className="mt-20 grid gap-14 wide:mt-32 wide:grid-cols-2">
          {nacional.tabs.length > 0 && (
            <section>
              <h2 className={h2}>
                <Link href="/primera-nacional" className="hover:underline">
                  Primera Nacional
                </Link>
              </h2>
              <div className="mt-6 grid gap-6">
                {zones(nacional.tabs).map((t) => (
                  <ZoneLeader
                    key={t.key}
                    title={`Líder de la ${t.label}`}
                    href={`/primera-nacional#${t.key}`}
                    row={t.rows[0]}
                    summary={t.summary}
                  />
                ))}
              </div>
            </section>
          )}
          {cupRound && (
            <section>
              <h2 className={h2}>
                <Link href="/copa-argentina" className="hover:underline">
                  Copa Argentina
                </Link>
              </h2>
              <div className="mt-6">
                <CupRound title={cupRound.title} ties={cupRound.ties} />
                {cupLine && <p className="mt-3 text-[15px]">{cupLine}</p>}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

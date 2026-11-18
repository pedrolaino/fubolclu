// TheSportsDB, only for when upcoming matches are played. The free key is public.
const BASE = "https://www.thesportsdb.com/api/v1/json/123";

export interface ScheduledEvent {
  // TheSportsDB team ids.
  home: number;
  away: number;
  kickoff: Date;
}

interface RawEvent {
  idHomeTeam: string | null;
  idAwayTeam: string | null;
  strTimestamp: string | null;
  strPostponed: string | null;
}

export function parseRound(json: unknown): ScheduledEvent[] {
  const events = (json as { events?: RawEvent[] | null }).events ?? [];
  return events.flatMap((e) =>
    e.idHomeTeam && e.idAwayTeam && e.strTimestamp && e.strPostponed !== "yes"
      ? [
          {
            home: Number(e.idHomeTeam),
            away: Number(e.idAwayTeam),
            // UTC, usually written without the zone.
            kickoff: new Date(
              /Z|[+-]\d\d:\d\d$/.test(e.strTimestamp) ? e.strTimestamp : `${e.strTimestamp}Z`,
            ),
          },
        ]
      : [],
  );
}

export async function roundEvents(league: number, season: number, round: number) {
  const res = await fetch(`${BASE}/eventsround.php?id=${league}&r=${round}&s=${season}`);
  if (!res.ok) throw new Error(`TheSportsDB league ${league} round ${round}: ${res.status}`);
  return parseRound(await res.json());
}

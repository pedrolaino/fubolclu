import type { EventType, MatchStatus, Phase, Tournament } from "@/db/schema";

export interface StandingsMatch {
  homeTeamId: number;
  awayTeamId: number;
  homeGoals: number | null;
  awayGoals: number | null;
  status: MatchStatus | null;
  phase: Phase;
  tournament: Tournament | null;
  matchday: number | null;
  kickoff: Date;
}

export interface TeamName {
  id: number;
  name: string;
}

export interface Row {
  teamId: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

const finished = (m: StandingsMatch) =>
  m.status === "finished" && m.homeGoals !== null && m.awayGoals !== null;

function tally(matches: StandingsMatch[], teamIds: number[]) {
  const rows = new Map<number, Row>(
    teamIds.map((teamId) => [
      teamId,
      { teamId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
    ]),
  );
  for (const m of matches.filter(finished)) {
    for (const [teamId, gf, ga] of [
      [m.homeTeamId, m.homeGoals!, m.awayGoals!],
      [m.awayTeamId, m.awayGoals!, m.homeGoals!],
    ]) {
      const row = rows.get(teamId);
      if (!row) continue;
      row.played++;
      row.goalsFor += gf;
      row.goalsAgainst += ga;
      if (gf > ga) row.won++;
      else if (gf === ga) row.drawn++;
      else row.lost++;
      row.points = row.won * 3 + row.drawn;
    }
  }
  return [...rows.values()];
}

// Order: points, goal difference, goals for, head-to-head points among the tied teams, name.
export function table(matches: StandingsMatch[], teams: TeamName[]): Row[] {
  const rows = tally(
    matches,
    teams.map((t) => t.id),
  );
  const key = (r: Row) => `${r.points}/${r.goalsFor - r.goalsAgainst}/${r.goalsFor}`;
  const headToHead = new Map<number, number>();
  for (const tied of Object.values(Object.groupBy(rows, key))) {
    const ids = tied!.map((r) => r.teamId);
    if (ids.length < 2) continue;
    const between = matches.filter((m) => ids.includes(m.homeTeamId) && ids.includes(m.awayTeamId));
    for (const r of tally(between, ids)) headToHead.set(r.teamId, r.points);
  }
  const name = new Map(teams.map((t) => [t.id, t.name]));
  return rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor ||
      (headToHead.get(b.teamId) ?? 0) - (headToHead.get(a.teamId) ?? 0) ||
      name.get(a.teamId)!.localeCompare(name.get(b.teamId)!, "es"),
  );
}

// Interzonal matches count too: each team's row only takes its own results.
export function zoneTable(matches: StandingsMatch[], tournament: Tournament, zone: TeamName[]) {
  return table(
    matches.filter((m) => m.phase === "league" && m.tournament === tournament),
    zone,
  );
}

export function annualTable(matches: StandingsMatch[], teams: TeamName[]) {
  return table(
    matches.filter((m) => m.phase === "league"),
    teams,
  );
}

// Seasons are whatever rows the caller passes: one per team and season of top-flight league play.
export function averagesTable(
  seasons: { teamId: number; played: number; points: number }[],
  teams: TeamName[],
) {
  const name = new Map(teams.map((t) => [t.id, t.name]));
  const rows = teams.map(({ id }) => {
    const own = seasons.filter((s) => s.teamId === id);
    const played = own.reduce((sum, s) => sum + s.played, 0);
    const points = own.reduce((sum, s) => sum + s.points, 0);
    return { teamId: id, played, points, average: played ? points / played : 0 };
  });
  return rows.sort(
    (a, b) => b.average - a.average || name.get(a.teamId)!.localeCompare(name.get(b.teamId)!, "es"),
  );
}

export interface ScorerEvent {
  playerId: number | null;
  playerName: string;
  teamId: number;
  type: EventType;
}

// Pass events in kickoff order: a player's team is the one of their latest goal.
export function scorers(events: ScorerEvent[]) {
  const rows = new Map<
    string,
    {
      playerId: number | null;
      playerName: string;
      teamId: number;
      goals: number;
      penalties: number;
    }
  >();
  for (const e of events) {
    if (e.type !== "goal" && e.type !== "penalty_goal") continue;
    const key = e.playerId === null ? `name:${e.playerName}` : `id:${e.playerId}`;
    const row = rows.get(key) ?? { ...e, goals: 0, penalties: 0 };
    rows.set(key, {
      playerId: row.playerId,
      playerName: row.playerName,
      teamId: e.teamId,
      goals: row.goals + 1,
      penalties: row.penalties + (e.type === "penalty_goal" ? 1 : 0),
    });
  }
  return [...rows.values()].sort(
    (a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName, "es"),
  );
}

export function form(matches: StandingsMatch[], teamId: number, count = 5) {
  return matches
    .filter((m) => finished(m) && (m.homeTeamId === teamId || m.awayTeamId === teamId))
    .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime())
    .slice(-count)
    .map((m) => {
      const [gf, ga] =
        m.homeTeamId === teamId ? [m.homeGoals!, m.awayGoals!] : [m.awayGoals!, m.homeGoals!];
      return gf > ga ? "W" : gf === ga ? "D" : "L";
    });
}

// Pass the matches of one table (e.g. a zone's tournament) and its teams.
export function positionHistory(matches: StandingsMatch[], teams: TeamName[], teamId: number) {
  const league = matches.filter((m) => m.phase === "league" && m.matchday !== null && finished(m));
  const matchdays = [...new Set(league.map((m) => m.matchday!))].sort((a, b) => a - b);
  return matchdays.map((matchday) => ({
    matchday,
    position:
      table(
        league.filter((m) => m.matchday! <= matchday),
        teams,
      ).findIndex((r) => r.teamId === teamId) + 1,
  }));
}

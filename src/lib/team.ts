import type { CompetitionSeason } from "@/config/seasons/types";
import type { Competition } from "@/db/schema";
import { dayLabel, timeLabel } from "@/lib/dates";
import {
  roundName,
  roundPhrase,
  stageDepth,
  type LeagueMatch,
  type Result,
  type TeamView,
} from "@/lib/league";
import { paint } from "@/lib/paint";
import {
  contestName,
  ofContest,
  tableState,
  tieWinner,
  unplayed,
  isUpcoming,
  withArticle,
} from "@/lib/results";
import { positionHistory, scorers, zoneTable, type Row, type ScorerEvent } from "@/lib/standings";

export interface TeamMatch extends LeagueMatch {
  competition: Competition;
}

export interface TeamData {
  teams: { id: number; name: string; slug: string; logoUrl: string | null }[];
  // Every match of the season, all competitions.
  matches: TeamMatch[];
  groups: { competition: Competition; groupName: string; teamId: number }[];
  // Goal events of the team's matches in kickoff order.
  goals: ScorerEvent[];
}

export interface Fixture {
  id: number;
  status: LeagueMatch["status"];
  date: string;
  time: string;
  competition: string;
  round: string;
  home: boolean;
  rival: TeamView;
  homeGoals: number | null;
  awayGoals: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
  result: Result | null;
}

export interface Standing {
  // "la Zona A del Clausura"
  zone: string;
  position: number;
  size: number;
  // Teams that qualify, when the table has a line, and what the line means.
  spots: number | null;
  lineNote: string | null;
  history: { matchday: number; position: number }[];
  record: Row;
}

export const toTeamView = (t: TeamData["teams"][number]): TeamView => ({ ...t, ...paint(t.id) });

const contestOf = (m: Pick<TeamMatch, "competition" | "tournament">) =>
  m.tournament ?? m.competition;

// "Clausura", "Primera Nacional"
export const competitionName = (m: Pick<TeamMatch, "competition" | "tournament">) =>
  contestName(contestOf(m));

// "la fecha 16 del Clausura", "los octavos de final de la Copa Argentina"
export const roundOf = (m: TeamMatch) => `${roundPhrase(m)} ${ofContest(contestOf(m))}`;

const shortDay = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

// "dom 22 nov"
const dateLabel = (date: Date) => shortDay.format(date).replace(/[,.]/g, "");

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const involves = (m: LeagueMatch, id: number) => m.homeTeamId === id || m.awayTeamId === id;

function standing(
  teamId: number,
  data: TeamData,
  competitions: CompetitionSeason[],
  now: Date,
  teamName: (id: number) => string,
): (Standing & { state: ReturnType<typeof tableState> }) | null {
  for (const config of competitions) {
    const own = data.groups.filter((g) => g.competition === config.competition);
    if (!config.standings || !own.some((g) => g.teamId === teamId)) continue;
    const league = data.matches
      .filter((m) => m.competition === config.competition && m.phase === "league")
      .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
    // Same rule as the league page: the tournament of the latest league match that has kicked off.
    const tournament =
      league.findLast((m) => m.kickoff <= now)?.tournament ?? league[0]?.tournament ?? null;
    const prefix = tournament ? `${contestName(tournament)} - ` : "";
    const names = [...new Set(own.map((g) => g.groupName))]
      .filter((name) => !tournament || name.startsWith(prefix))
      .sort();
    const mine = own.find((g) => g.teamId === teamId && names.includes(g.groupName));
    if (!mine) continue;
    const members = own
      .filter((g) => g.groupName === mine.groupName)
      .map((g) => ({ id: g.teamId, name: teamName(g.teamId) }));
    const matches = league.filter((m) => m.tournament === tournament);
    const rows = zoneTable(matches, tournament, members);
    const index = rows.findIndex((r) => r.teamId === teamId);
    const letter = String.fromCharCode(65 + names.indexOf(mine.groupName));
    const top = config.zoneLines?.find((l) => "top" in l);
    // Same rule as the league page: the zone is over when no match of any of its teams is left.
    const ids = new Set(members.map((t) => t.id));
    const zoneMatches = matches.filter((m) => ids.has(m.homeTeamId) || ids.has(m.awayTeamId));
    const spots = top && "top" in top ? top.top : undefined;
    return {
      zone: `la Zona ${letter}${tournament ? ` ${ofContest(tournament)}` : ""}`,
      position: index + 1,
      size: rows.length,
      spots: spots && spots < rows.length ? spots : null,
      lineNote: top?.note ?? null,
      history: positionHistory(matches, members, teamId),
      record: rows[index],
      state: tableState(rows, zoneMatches),
    };
  }
  return null;
}

export function buildTeam(
  teamId: number,
  data: TeamData,
  competitions: CompetitionSeason[],
  now: Date,
) {
  const teams = new Map(data.teams.map((t) => [t.id, toTeamView(t)]));
  const self = teams.get(teamId);
  if (!self) return null;

  const mine = data.matches
    .filter((m) => involves(m, teamId))
    .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());

  const fixtures = mine.map((m): Fixture => {
    const home = m.homeTeamId === teamId;
    const played = m.status === "finished" && m.homeGoals !== null && m.awayGoals !== null;
    const [gf, ga] = home ? [m.homeGoals, m.awayGoals] : [m.awayGoals, m.homeGoals];
    return {
      id: m.id,
      status: m.status,
      date: dateLabel(m.kickoff),
      time: timeLabel(m.kickoff),
      competition: competitionName(m),
      round: roundName(m),
      home,
      rival: teams.get(home ? m.awayTeamId : m.homeTeamId)!,
      homeGoals: m.homeGoals,
      awayGoals: m.awayGoals,
      homePenalties: m.homePenalties,
      awayPenalties: m.awayPenalties,
      result: played ? (gf! > ga! ? "W" : gf === ga ? "D" : "L") : null,
    };
  });
  const upcoming = fixtures.filter((f) => f.status !== "finished");
  const results = fixtures.filter((f) => f.status === "finished").reverse();

  const table = standing(teamId, data, competitions, now, (id) => teams.get(id)!.name);

  const next = mine.find((m) => isUpcoming(m, now));
  const last = mine.findLast((m) => m.status === "finished" && m.homeGoals !== null);
  let sentence = "";
  if (table) {
    const points = plural(table.record.points, "punto", "puntos");
    sentence =
      table.state === "unstarted"
        ? `Todavía no se jugó ningún partido de ${table.zone}.`
        : table.state === "over"
          ? table.position === 1
            ? `Ganó ${table.zone} con ${points}.`
            : `Terminó ${table.position}º en ${table.zone} con ${points}.`
          : table.position === 1
            ? `Lidera ${table.zone} con ${points}.`
            : `Es ${table.position}º en ${table.zone} con ${points}.`;
  } else if (mine.length) {
    // The competition it is playing now, or the last one it played.
    const contest = contestOf(mine.find(unplayed) ?? mine.at(-1)!);
    const own = mine.filter((m) => contestOf(m) === contest);
    // Through a knockout round whose next tie isn't drawn yet still counts as playing it.
    const lastTie = own.findLast((m) => m.phase === "knockout" && tieWinner(m));
    const through =
      lastTie !== undefined &&
      stageDepth(lastTie) !== 5 &&
      tieWinner(lastTie) === (lastTie.homeTeamId === teamId ? "home" : "away") &&
      lastTie === own.findLast((m) => m.status === "finished");
    sentence = `${own.some(unplayed) || through ? "Juega" : "Jugó"} ${withArticle(contest)}.`;
  }
  if (next) {
    const home = next.homeTeamId === teamId;
    const rival = teams.get(home ? next.awayTeamId : next.homeTeamId)!.name;
    sentence += ` El ${dayLabel(next.kickoff)} ${home ? "recibe a" : "visita a"} ${rival} por ${roundOf(next)}.`;
  } else if (last) {
    const f = fixtures.find((f) => f.id === last.id)!;
    const [gf, ga] = f.home ? [f.homeGoals!, f.awayGoals!] : [f.awayGoals!, f.homeGoals!];
    const verb = gf > ga ? "ganó" : gf === ga ? "empató" : "perdió";
    sentence += ` En su último partido ${verb} ${Math.max(gf, ga)}-${Math.min(gf, ga)} ${gf > ga ? "a" : "con"} ${f.rival.name}.`;
  }

  const done = mine.filter((m) => m.status === "finished");
  const withDetails = done.filter((m) => m.detailsSyncedAt).length;
  const top = scorers(data.goals.filter((g) => g.teamId === teamId)).slice(0, 8);
  const scorerBlock = table && {
    rows: top.map(({ playerName, goals, penalties }) => ({ playerName, goals, penalties })),
    // The scorers fill in as match details are fetched, a few dozen a day.
    note:
      done.length && withDetails < done.length
        ? `Con los goles de ${withDetails} de los ${done.length} partidos jugados.`
        : null,
    empty: withDetails < done.length ? "Todavía no cargamos los goles." : "Todavía no hizo goles.",
  };

  return {
    team: self,
    summary: sentence,
    standing: table && {
      zone: table.zone,
      position: table.position,
      size: table.size,
      spots: table.spots,
      lineNote: table.lineNote,
      history: table.history,
      record: table.record,
    },
    scorers: scorerBlock,
    upcoming,
    results,
  };
}

export type TeamPage = NonNullable<ReturnType<typeof buildTeam>>;

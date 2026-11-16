import type { CompetitionSeason } from "@/config/seasons/types";
import type { MatchStatus, Tournament } from "@/db/schema";
import { dayLabel, rangeLabel } from "@/lib/dates";
import { paint } from "@/lib/paint";
import {
  annualTable,
  averagesTable,
  form,
  scorers,
  zoneTable,
  type Row,
  type ScorerEvent,
  type StandingsMatch,
} from "@/lib/standings";

export interface LeagueMatch extends StandingsMatch {
  id: number;
  roundLabel: string;
  status: MatchStatus;
  homePenalties: number | null;
  awayPenalties: number | null;
  detailsSyncedAt: Date | null;
}

export interface LeagueData {
  teams: { id: number; name: string; slug: string; logoUrl: string | null }[];
  matches: LeagueMatch[];
  // Zone membership, from the provider's standings groups.
  groups: { groupName: string; teamId: number }[];
  // Goal events of the season in kickoff order.
  goals: ScorerEvent[];
  // Past top-flight seasons, for the averages table.
  history: { teamId: number; played: number; points: number }[];
}

export interface TeamView {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  lead: string;
  onLead: string;
}

export type Result = "W" | "D" | "L";

export interface TableRow extends Omit<Row, "teamId"> {
  team: TeamView;
  form: Result[];
}

export interface AverageRow {
  team: TeamView;
  played: number;
  points: number;
  average: number;
}

export interface ScorerRow {
  playerName: string;
  team: TeamView;
  goals: number;
  penalties: number;
}

interface TabBase {
  key: string;
  label: string;
  // The team whose colours paint the page while this tab is open.
  subject: TeamView;
  title: string;
  summary: string;
  notes: string[];
}

export type Tab = TabBase &
  (
    | { kind: "table"; rows: TableRow[]; lines: number[] }
    | { kind: "averages"; rows: AverageRow[]; lines: number[] }
    | { kind: "scorers"; rows: ScorerRow[] }
  );

export interface MatchView {
  id: number;
  kickoff: Date;
  status: MatchStatus;
  home: TeamView;
  away: TeamView;
  homeGoals: number | null;
  awayGoals: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
}

export interface Round {
  title: string;
  day: string;
  matches: MatchView[];
}

const tournamentName: Record<Tournament, string> = { apertura: "Apertura", clausura: "Clausura" };

const knockoutNames: [RegExp, string, string][] = [
  [/Round of 64/, "32avos de final", "los 32avos de final"],
  [/Round of 32/, "16avos de final", "los 16avos de final"],
  [/Round of 16|8th Finals/, "Octavos de final", "los octavos de final"],
  [/Quarter/, "Cuartos de final", "los cuartos de final"],
  [/Semi/, "Semifinales", "las semifinales"],
  [/Final/, "Final", "la final"],
];

type RoundInfo = Pick<LeagueMatch, "roundLabel" | "phase" | "matchday">;

const knockout = (m: RoundInfo) => knockoutNames.find(([label]) => label.test(m.roundLabel));

export function roundName(m: RoundInfo) {
  if (m.phase === "league" && m.matchday !== null) return `Fecha ${m.matchday}`;
  return knockout(m)?.[1] ?? m.roundLabel;
}

export function roundPhrase(m: RoundInfo) {
  if (m.phase === "league" && m.matchday !== null) return `la fecha ${m.matchday}`;
  return knockout(m)?.[2] ?? m.roundLabel;
}

const pending = (m: LeagueMatch) => m.status === "scheduled" || m.status === "live";
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function buildLeague(data: LeagueData, config: CompetitionSeason, now: Date) {
  const teams = new Map(data.teams.map((t) => [t.id, { ...t, ...paint(t.id) }]));
  const team = (id: number) => teams.get(id)!;
  const byKickoff = [...data.matches].sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
  const league = byKickoff.filter((m) => m.phase === "league");

  // The tournament of the latest league match that has kicked off; null for single-table leagues.
  const tournament =
    league.findLast((m) => m.kickoff <= now)?.tournament ?? league[0]?.tournament ?? null;

  const nextMatch = (teamId: number) => {
    const m = byKickoff.find(
      (m) => pending(m) && (m.homeTeamId === teamId || m.awayTeamId === teamId),
    );
    if (!m) return "";
    const home = m.homeTeamId === teamId;
    const rival = team(home ? m.awayTeamId : m.homeTeamId).name;
    return ` El ${dayLabel(m.kickoff)} ${home ? "recibe a" : "visita a"} ${rival} por ${roundPhrase(m)}.`;
  };

  const toRows = (rows: Row[], matches: LeagueMatch[]): TableRow[] =>
    rows.map(({ teamId, ...row }) => ({
      ...row,
      team: team(teamId),
      form: form(matches, teamId) as Result[],
    }));

  const tabs: Tab[] = [];

  const prefix = tournament ? `${tournamentName[tournament]} - ` : "";
  const zoneNames = [...new Set(data.groups.map((g) => g.groupName))]
    .filter((name) => (tournament ? name.startsWith(prefix) : true))
    .sort();
  zoneNames.forEach((groupName, i) => {
    const members = data.groups.filter((g) => g.groupName === groupName).map((g) => team(g.teamId));
    const matches = league.filter((m) => m.tournament === tournament);
    const rows = zoneTable(matches, tournament, members);
    if (!rows.length) return;
    const letter = String.fromCharCode(65 + i);
    const zone = `la Zona ${letter}${tournament ? ` del ${tournamentName[tournament]}` : ""}`;
    const [first, second] = rows;
    const ids = new Set(members.map((t) => t.id));
    const over = !matches.some(
      (m) => pending(m) && (ids.has(m.homeTeamId) || ids.has(m.awayTeamId)),
    );
    const gap = second ? first.points - second.points : 0;
    const margin = !second
      ? ""
      : gap === 0
        ? `, igualado con ${team(second.teamId).name}`
        : `, ${gap} más que ${team(second.teamId).name}`;
    const zoneLines = (config.zoneLines ?? []).map((l) => ({
      at: "top" in l ? l.top : rows.length - l.bottom,
      note: l.note,
    }));
    tabs.push({
      kind: "table",
      key: `zona-${letter.toLowerCase()}`,
      label: `Zona ${letter}`,
      subject: team(first.teamId),
      title: team(first.teamId).name,
      summary:
        (over
          ? `Ganó ${zone} con ${plural(first.points, "punto", "puntos")}.`
          : `Lidera ${zone} con ${plural(first.points, "punto", "puntos")}${margin}.`) +
        nextMatch(first.teamId),
      rows: toRows(rows, matches),
      lines: zoneLines.map((l) => l.at).filter((n) => n > 0 && n < rows.length),
      notes: zoneLines.map((l) => l.note),
    });
  });

  const everyone = [...new Set(data.groups.map((g) => g.teamId))].map(team);
  const annual = annualTable(league, everyone);

  if (config.annual && annual.length) {
    const { libertadores, relegated } = config.annual;
    const first = annual[0];
    const over = !league.some(pending);
    const points = plural(first.points, "punto", "puntos");
    tabs.push({
      kind: "table",
      key: "anual",
      label: "Anual",
      subject: team(first.teamId),
      title: team(first.teamId).name,
      summary: over
        ? `Terminó primero en la tabla anual con ${points} y es Campeón de Liga.`
        : `Lidera la tabla anual con ${points} en ${plural(first.played, "partido", "partidos")}. Quien termine primero es Campeón de Liga.`,
      rows: toRows(annual, league),
      lines: [libertadores, annual.length - relegated].filter((n) => n > 0 && n < annual.length),
      notes: [
        `Los ${libertadores} mejores que no salgan campeones van a la Copa Libertadores.`,
        `Debajo de la última línea, el que desciende a la Primera Nacional.`,
      ],
    });
  }

  if (config.averages && annual.length) {
    const seasons = [
      ...data.history,
      ...annual.map(({ teamId, played, points }) => ({ teamId, played, points })),
    ];
    const rows = averagesTable(seasons, everyone);
    const last = rows.at(-1)!;
    tabs.push({
      kind: "averages",
      key: "promedios",
      label: "Promedios",
      subject: team(last.teamId),
      title: team(last.teamId).name,
      summary: `Tiene el peor promedio de la categoría: ${last.average.toFixed(3).replace(".", ",")}. Si termina así, desciende.`,
      rows: rows.map(({ teamId, ...row }) => ({ ...row, team: team(teamId) })),
      lines: [rows.length - config.averages.relegated],
      notes: [
        "Debajo de la línea, el que desciende por promedio.",
        "Puntos de las últimas tres temporadas en Primera divididos por los partidos jugados.",
      ],
    });
  }

  const top = scorers(data.goals).slice(0, 30);
  if (top.length) {
    const [first] = top;
    const done = data.matches.filter((m) => m.status === "finished");
    const withDetails = done.filter((m) => m.detailsSyncedAt).length;
    const penalties = first.penalties ? `, ${first.penalties} de penal` : "";
    tabs.push({
      kind: "scorers",
      key: "goleadores",
      label: "Goleadores",
      subject: team(first.teamId),
      title: first.playerName,
      summary: `Lleva ${plural(first.goals, "gol", "goles")} en la temporada${penalties}. Juega en ${team(first.teamId).name}.`,
      rows: top.map(({ teamId, playerName, goals, penalties }) => ({
        playerName,
        goals,
        penalties,
        team: team(teamId),
      })),
      // The scorers table fills in as match details are fetched, a few dozen a day.
      notes:
        withDetails < done.length
          ? [`Con los goles de ${withDetails} de los ${done.length} partidos jugados.`]
          : [],
    });
  }

  const view = (m: LeagueMatch): MatchView => ({
    id: m.id,
    kickoff: m.kickoff,
    status: m.status,
    home: team(m.homeTeamId),
    away: team(m.awayTeamId),
    homeGoals: m.homeGoals,
    awayGoals: m.awayGoals,
    homePenalties: m.homePenalties,
    awayPenalties: m.awayPenalties,
  });
  const round = (of: LeagueMatch | undefined): Round | null => {
    if (!of) return null;
    const matches = byKickoff.filter((m) => m.roundLabel === of.roundLabel);
    return {
      title: roundName(of),
      day: rangeLabel(matches[0].kickoff, matches.at(-1)!.kickoff),
      matches: matches.map(view),
    };
  };

  return {
    tabs,
    latest: round(byKickoff.findLast((m) => m.status === "finished")),
    next: round(byKickoff.find(pending)),
  };
}

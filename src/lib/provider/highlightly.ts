import type { CompetitionSeason, RoundRule } from "@/config/seasons/types";
import type { EventType, MatchStatus } from "@/db/schema";
import {
  PAGE_SIZE,
  type FootballProvider,
  type Match,
  type MatchDetail,
  type MatchEvent,
  type MatchPage,
  type Standing,
  type Team,
} from ".";

const BASE_URL = "https://soccer.highlightly.net";

interface RawTeam {
  id: number;
  name: string;
  logo?: string | null;
}

interface RawMatch {
  id: number;
  round: string;
  date: string;
  state: { description: string; score: { current: string | null; penalties: string | null } };
  homeTeam: RawTeam;
  awayTeam: RawTeam;
}

interface RawEvent {
  team: RawTeam;
  time: string;
  type: string;
  player: string | null;
  playerId: number | null;
  assist: string | null;
  assistingPlayerId: number | null;
  substituted: string | null;
}

interface RawStandings {
  groups: {
    name: string;
    standings: {
      team: RawTeam;
      position: number;
      points: number;
      total: {
        games: number;
        wins: number;
        draws: number;
        loses: number;
        scoredGoals: number;
        receivedGoals: number;
      };
    }[];
  }[];
}

const eventTypes: Record<string, EventType> = {
  goal: "goal",
  "own goal": "own_goal",
  penalty: "penalty_goal",
  "penalty goal": "penalty_goal",
  "missed penalty": "missed_penalty",
  "penalty missed": "missed_penalty",
  "yellow card": "yellow_card",
  "red card": "red_card",
  "second yellow card": "red_card",
  "yellow red card": "red_card",
  substitution: "substitution",
};

export function parseRound(label: string, rules: RoundRule[]) {
  for (const rule of rules) {
    const match = rule.label.exec(label);
    if (match) {
      return {
        tournament: rule.tournament ?? null,
        phase: rule.phase,
        matchday: match[1] ? Number(match[1]) : null,
      };
    }
  }
  throw new Error(`No round rule matches "${label}"`);
}

export function parseStatus(description: string, kickoff: Date, now: Date): MatchStatus | null {
  const d = description.toLowerCase();
  if (d.startsWith("finished")) return "finished";
  if (d === "not started" || d.includes("to be")) return "scheduled";
  if (/half|extra time|penalt|break|in progress/.test(d)) return "live";
  if (/postpon|abandon|suspend|interrupt|delay/.test(d)) return "postponed";
  if (d.startsWith("cancel")) return "cancelled";
  console.warn(`Unknown match status "${description}"`);
  return kickoff > now ? "scheduled" : null;
}

function parseScore(score: string | null): [number, number] | [null, null] {
  const m = score && /^(\d+) - (\d+)$/.exec(score);
  return m ? [Number(m[1]), Number(m[2])] : [null, null];
}

const team = (t: RawTeam): Team => ({ id: t.id, name: t.name, logoUrl: t.logo ?? null });

export function parseMatchPage(
  json: unknown,
  competition: CompetitionSeason,
  season: number,
  now: Date,
): MatchPage {
  const { data, pagination } = json as { data: RawMatch[]; pagination: { totalCount: number } };
  if (!Array.isArray(data)) throw new Error("Unexpected matches response");
  const teams = new Map<number, Team>();
  const matches = data.map((raw): Match => {
    teams.set(raw.homeTeam.id, team(raw.homeTeam));
    teams.set(raw.awayTeam.id, team(raw.awayTeam));
    const kickoff = new Date(raw.date);
    const [homeGoals, awayGoals] = parseScore(raw.state.score.current);
    const [homePenalties, awayPenalties] = parseScore(raw.state.score.penalties);
    return {
      id: raw.id,
      competition: competition.competition,
      season,
      roundLabel: raw.round,
      ...parseRound(raw.round, competition.rounds),
      kickoff,
      status: parseStatus(raw.state.description, kickoff, now),
      homeTeamId: raw.homeTeam.id,
      awayTeamId: raw.awayTeam.id,
      homeGoals,
      awayGoals,
      homePenalties,
      awayPenalties,
    };
  });
  return { matches, teams: [...teams.values()], total: pagination.totalCount };
}

function parseEvent(raw: RawEvent): MatchEvent | null {
  const type = eventTypes[raw.type.toLowerCase()];
  const time = /^(\d+)(?:\+(\d+))?$/.exec(raw.time);
  if (!type || !time) return null;
  return {
    teamId: raw.team.id,
    playerId: raw.playerId,
    playerName: raw.player ?? "",
    assistPlayerId: raw.assistingPlayerId,
    // Substitutions name the player going off in `player` and the one coming on in `substituted`.
    assistPlayerName: raw.assist ?? raw.substituted,
    type,
    minute: Number(time[1]),
    extraMinute: time[2] ? Number(time[2]) : null,
  };
}

export function parseMatchDetail(json: unknown): MatchDetail {
  const [raw] = json as { events: RawEvent[]; statistics: unknown }[];
  if (!raw || !Array.isArray(raw.events)) throw new Error("Unexpected match detail response");
  // TODO: check whether shoot-out kicks arrive as "Penalty" events; they would count as goals.
  const events = raw.events.map(parseEvent).filter((e) => e !== null);
  return { events, stats: raw.statistics ?? null };
}

export function parseStandings(json: unknown): Standing[] {
  const { groups } = json as RawStandings;
  if (!Array.isArray(groups)) throw new Error("Unexpected standings response");
  return groups.flatMap((g) =>
    g.standings.map((s) => ({
      groupName: g.name,
      team: team(s.team),
      position: s.position,
      played: s.total.games,
      won: s.total.wins,
      drawn: s.total.draws,
      lost: s.total.loses,
      goalsFor: s.total.scoredGoals,
      goalsAgainst: s.total.receivedGoals,
      points: s.points,
    })),
  );
}

async function get(path: string, params: Record<string, string | number> = {}): Promise<unknown> {
  const key = process.env.HIGHLIGHTLY_API_KEY;
  if (!key) throw new Error("HIGHLIGHTLY_API_KEY is not set");
  const url = new URL(path, BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, {
    headers: { "x-rapidapi-key": key },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(
      `GET ${url.pathname}${url.search}: ${res.status} ${(await res.text()).slice(0, 200)}`,
    );
  }
  return res.json();
}

export const highlightly: FootballProvider = {
  async listMatches(competition, season, offset) {
    const json = await get("/matches", {
      leagueId: competition.leagueId,
      season,
      limit: PAGE_SIZE,
      offset,
    });
    return parseMatchPage(json, competition, season, new Date());
  },
  async matchDetail(id) {
    return parseMatchDetail(await get(`/matches/${id}`));
  },
  async standings(competition, season) {
    return parseStandings(await get("/standings", { leagueId: competition.leagueId, season }));
  },
};

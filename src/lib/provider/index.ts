import type { CompetitionSeason } from "@/config/seasons/types";
import type { Competition, EventType, MatchStatus, Phase, Tournament } from "@/db/schema";

export interface Team {
  id: number;
  name: string;
  logoUrl: string | null;
}

export interface Match {
  id: number;
  competition: Competition;
  season: number;
  roundLabel: string;
  tournament: Tournament | null;
  phase: Phase;
  matchday: number | null;
  kickoff: Date;
  // null: the provider sent a status we don't know, keep the stored one.
  status: MatchStatus | null;
  homeTeamId: number;
  awayTeamId: number;
  homeGoals: number | null;
  awayGoals: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
}

export interface MatchPage {
  matches: Match[];
  teams: Team[];
  total: number;
}

export interface MatchEvent {
  teamId: number;
  playerId: number | null;
  playerName: string;
  assistPlayerId: number | null;
  assistPlayerName: string | null;
  type: EventType;
  minute: number;
  extraMinute: number | null;
}

export interface MatchDetail {
  events: MatchEvent[];
  stats: unknown;
}

export interface Standing {
  groupName: string;
  team: Team;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export const PAGE_SIZE = 100;

export interface FootballProvider {
  listMatches(competition: CompetitionSeason, season: number, offset: number): Promise<MatchPage>;
  matchDetail(id: number): Promise<MatchDetail>;
  standings(competition: CompetitionSeason, season: number): Promise<Standing[]>;
}

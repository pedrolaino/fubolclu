import type { Competition, Phase, Tournament } from "@/db/schema";

export interface RoundRule {
  // League-phase patterns capture the matchday as their first group.
  label: RegExp;
  phase: Phase;
  tournament?: Tournament;
}

export interface CompetitionSeason {
  competition: Competition;
  leagueId: number;
  standings: boolean;
  // First match wins.
  rounds: RoundRule[];
  // Teams per zone that go on to the knockouts.
  playoffSpots?: number;
  // Season-long table of both tournaments' league phases.
  annual?: { libertadores: number; relegated: number };
  // Points per game over the last three seasons.
  averages?: { relegated: number };
}

export interface SeasonConfig {
  season: number;
  // In sync priority order.
  competitions: CompetitionSeason[];
}

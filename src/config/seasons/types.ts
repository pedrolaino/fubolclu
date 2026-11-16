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
}

export interface SeasonConfig {
  season: number;
  // In sync priority order.
  competitions: CompetitionSeason[];
}

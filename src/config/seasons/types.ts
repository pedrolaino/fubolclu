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
  // A line on every zone table: under the first `top` teams or above the last `bottom` ones.
  // The note says what the line means.
  zoneLines?: ({ top: number; note: string } | { bottom: number; note: string })[];
  // Season-long table of both tournaments' league phases.
  annual?: { libertadores: number; relegated: number };
  // Points per game over the last three seasons.
  averages?: { relegated: number };
  // Ways into the Copa Libertadores besides the annual table.
  libertadoresDoors?: ("apertura" | "clausura" | "copa-argentina")[];
  // The Apertura champion plays the Clausura champion.
  trofeoDeCampeones?: boolean;
}

export interface SeasonConfig {
  season: number;
  // A closing line for the season map, e.g. a format change coming the next year.
  note?: string;
  // In sync priority order.
  competitions: CompetitionSeason[];
}

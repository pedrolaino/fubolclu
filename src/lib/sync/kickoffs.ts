import { sportsDbTeams } from "@/config/sports-db";
import type { Competition, Phase } from "@/db/schema";
import type { ScheduledEvent } from "@/lib/provider/sportsdb";

export interface Upcoming {
  id: number;
  competition: Competition;
  phase: Phase;
  matchday: number | null;
  roundLabel: string;
  homeTeamId: number;
  awayTeamId: number;
  kickoff: Date;
  // What Highlightly says, which may be its placeholder for the round.
  providerKickoff: Date;
}

// TheSportsDB numbers knockout rounds in two ways; the first one is what it uses now.
const knockoutRounds: Record<string, number[]> = {
  "Round of 64": [64],
  "Round of 32": [32],
  "Round of 16": [160, 16],
  "Quarter-finals": [125, 8],
  "Semi-finals": [150, 4],
  Final: [200, 2],
  "Super Final": [200, 2],
};

export function roundNumbers(m: Pick<Upcoming, "phase" | "matchday" | "roundLabel">) {
  if (m.phase === "league") return m.matchday ? [m.matchday] : [];
  return knockoutRounds[m.roundLabel.replace(/^(Apertura|Clausura) - /, "")] ?? [];
}

// TheSportsDB writes a day without a time as midnight in Buenos Aires.
const dayOnly = (d: Date) => d.getUTCHours() === 3 && d.getUTCMinutes() === 0;
const MONTH = 30 * 24 * 60 * 60 * 1000;

export function findKickoff(m: Upcoming, events: ScheduledEvent[]) {
  const home = sportsDbTeams[m.homeTeamId];
  const away = sportsDbTeams[m.awayTeamId];
  const gap = (e: ScheduledEvent) => Math.abs(e.kickoff.getTime() - m.providerKickoff.getTime());
  // One league round number covers the same matchday of both tournaments: take the closer one.
  const [match] = events
    .filter((e) => e.home === home && e.away === away && !dayOnly(e.kickoff) && gap(e) < MONTH)
    .sort((a, b) => gap(a) - gap(b));
  return match?.kickoff ?? null;
}

// The kickoffs that change, asking for each round at most once.
export async function confirmedKickoffs(
  upcoming: Upcoming[],
  fetchRound: (competition: Competition, round: number) => Promise<ScheduledEvent[]>,
  maxRequests = 12,
) {
  const rounds = new Map<string, ScheduledEvent[]>();
  const changes: { id: number; kickoff: Date }[] = [];
  for (const m of upcoming) {
    for (const round of roundNumbers(m)) {
      const key = `${m.competition}|${round}`;
      if (!rounds.has(key)) {
        if (rounds.size >= maxRequests) break;
        rounds.set(key, await fetchRound(m.competition, round));
      }
      const kickoff = findKickoff(m, rounds.get(key)!);
      if (!kickoff) continue;
      if (kickoff.getTime() !== m.kickoff.getTime()) changes.push({ id: m.id, kickoff });
      break;
    }
  }
  return changes;
}

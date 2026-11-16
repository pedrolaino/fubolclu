import type { SeasonConfig } from "@/config/seasons/types";
import type { Competition, MatchStatus } from "@/db/schema";
import { PAGE_SIZE } from "@/lib/provider";

export interface PlannedMatch {
  id: number;
  competition: Competition;
  kickoff: Date;
  status: MatchStatus;
  detailsSyncedAt: Date | null;
}

export interface PlanInput {
  now: Date;
  budget: number;
  season: SeasonConfig;
  matches: PlannedMatch[];
  // Last successful sync per key, see the `stamp` of each call.
  stamps: Record<string, Date>;
}

export type Call =
  | { kind: "matches"; competition: Competition; offset: number; stamp?: string }
  | { kind: "recent"; competition: Competition; offset: number; stamp: string }
  | { kind: "standings"; competition: Competition; stamp: string }
  | { kind: "detail"; competition: Competition; matchId: number };

const HOUR = 3_600_000;

export const detailFailedKey = (matchId: number) => `detail-failed:${matchId}`;

// The provider lists matches newest first, so a match's page follows from how many kick off later.
function pagesOf(match: PlannedMatch, all: PlannedMatch[]) {
  const first = all.filter((m) => m.kickoff > match.kickoff).length;
  const last =
    first + all.filter((m) => m.kickoff.getTime() === match.kickoff.getTime()).length - 1;
  const pages = [];
  for (let p = Math.floor(first / PAGE_SIZE); p <= Math.floor(last / PAGE_SIZE); p++) pages.push(p);
  return pages;
}

export function plan({ now, budget, season, matches, stamps }: PlanInput): Call[] {
  const today = new Date(now).setUTCHours(0, 0, 0, 0);
  const due = (key: string) => (stamps[key]?.getTime() ?? 0) < today;
  const groups: Call[][] = [];

  for (const { competition } of season.competitions) {
    const own = matches.filter((m) => m.competition === competition);
    const fullKey = `matches:${competition}:${season.season}`;
    if (due(fullKey)) {
      // Sized from the matches we know; the runner follows on from the last page if the list grew.
      const pages = Math.floor(own.length / PAGE_SIZE) + 1;
      groups.push(
        Array.from({ length: pages }, (_, p) => ({
          kind: "matches",
          competition,
          offset: p * PAGE_SIZE,
          ...(p === pages - 1 && { stamp: fullKey }),
        })),
      );
      continue;
    }

    // TODO: fetch only today's matches if the API supports a date filter; pages are the fallback.
    // "postponed" covers interruptions and delays, which usually resume the same day.
    const unfinished = own.filter(
      (m) =>
        (m.status === "scheduled" || m.status === "live" || m.status === "postponed") &&
        m.kickoff <= now &&
        now.getTime() - m.kickoff.getTime() < 24 * HOUR,
    );
    // Extra time and penalties can run past three hours; six caps a match stuck as live.
    const live = unfinished.some((m) => {
      const age = now.getTime() - m.kickoff.getTime();
      return age < 3 * HOUR || (m.status === "live" && age < 6 * HOUR);
    });
    const recentKey = `recent:${competition}:${season.season}`;
    const lastRecent = stamps[recentKey]?.getTime() ?? 0;
    if (live || (unfinished.length && now.getTime() - lastRecent >= 3 * HOUR)) {
      const pages = new Set(unfinished.flatMap((m) => pagesOf(m, own)));
      groups.push(
        [...pages]
          .sort((a, b) => a - b)
          .map((p) => ({
            kind: "recent",
            competition,
            offset: p * PAGE_SIZE,
            stamp: recentKey,
          })),
      );
    }
  }

  for (const { competition, standings } of season.competitions) {
    const key = `standings:${competition}:${season.season}`;
    if (standings && due(key)) {
      groups.push([{ kind: "standings", competition, stamp: key }]);
    }
  }

  // Details wait three hours after kickoff so the provider has time to complete events and stats.
  // A failed one waits a day so it can't stall the ones behind it.
  for (const { competition } of season.competitions) {
    matches
      .filter(
        (m) =>
          m.competition === competition &&
          m.status === "finished" &&
          !m.detailsSyncedAt &&
          now.getTime() - m.kickoff.getTime() >= 3 * HOUR &&
          now.getTime() - (stamps[detailFailedKey(m.id)]?.getTime() ?? 0) >= 24 * HOUR,
      )
      .sort((a, b) => b.kickoff.getTime() - a.kickoff.getTime())
      .forEach((m) => groups.push([{ kind: "detail", competition, matchId: m.id }]));
  }

  const calls: Call[] = [];
  for (const group of groups) {
    if (calls.length + group.length <= budget) calls.push(...group);
  }
  return calls;
}

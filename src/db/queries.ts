import { and, asc, between, eq, inArray, max } from "drizzle-orm";
import { db } from "@/db";
import {
  historicalPoints,
  matchEvents,
  matches,
  providerStandings,
  syncState,
  teams,
  type Competition,
} from "@/db/schema";
import { currentSeason } from "@/config/seasons";
import { buildLeague, type LeagueData } from "@/lib/league";

async function leagueData(competition: Competition, season: number): Promise<LeagueData> {
  const scope = and(eq(matches.competition, competition), eq(matches.season, season));
  const [teamRows, matchRows, groups, goals, history] = await Promise.all([
    db.select().from(teams),
    db.select().from(matches).where(scope),
    db
      .select({ groupName: providerStandings.groupName, teamId: providerStandings.teamId })
      .from(providerStandings)
      .where(
        and(eq(providerStandings.competition, competition), eq(providerStandings.season, season)),
      ),
    db
      .select({
        playerId: matchEvents.playerId,
        playerName: matchEvents.playerName,
        teamId: matchEvents.teamId,
        type: matchEvents.type,
      })
      .from(matchEvents)
      .innerJoin(matches, eq(matchEvents.matchId, matches.id))
      .where(and(scope, inArray(matchEvents.type, ["goal", "penalty_goal"])))
      .orderBy(asc(matches.kickoff), asc(matchEvents.minute)),
    db
      .select({
        teamId: historicalPoints.teamId,
        played: historicalPoints.played,
        points: historicalPoints.points,
      })
      .from(historicalPoints)
      // The averages take the two seasons before this one.
      .where(between(historicalPoints.season, season - 2, season - 1)),
  ]);
  return { teams: teamRows, matches: matchRows, groups, goals, history };
}

// Tables and rounds of a league, as the page shows them.
// Cached with the default lifetime (revalidated every 15 minutes), so "now" is at most that old.
export async function loadLeague(competition: Competition) {
  "use cache";
  const config = currentSeason.competitions.find((c) => c.competition === competition)!;
  return buildLeague(await leagueData(competition, currentSeason.season), config, new Date());
}

// When the data last changed, for the footer.
export async function loadSyncedAt() {
  "use cache";
  const [row] = await db.select({ at: max(syncState.syncedAt) }).from(syncState);
  return row?.at ?? null;
}

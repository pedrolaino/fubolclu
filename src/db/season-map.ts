import { and, between, eq } from "drizzle-orm";
import { currentSeason } from "@/config/seasons";
import { db } from "@/db";
import { historicalPoints, matches, providerStandings, teams } from "@/db/schema";
import { buildSeasonMap } from "@/lib/season-map";

// Cached with the default lifetime (revalidated every 15 minutes), so "now" is at most that old.
export async function loadSeasonMap() {
  "use cache";
  const season = (competition: "liga-profesional" | "copa-argentina") =>
    and(eq(matches.competition, competition), eq(matches.season, currentSeason.season));

  const [teamRows, league, cup, groups, history] = await Promise.all([
    db.select().from(teams),
    db.select().from(matches).where(season("liga-profesional")),
    db.select().from(matches).where(season("copa-argentina")),
    db
      .select({ groupName: providerStandings.groupName, teamId: providerStandings.teamId })
      .from(providerStandings)
      .where(
        and(
          eq(providerStandings.competition, "liga-profesional"),
          eq(providerStandings.season, currentSeason.season),
        ),
      ),
    db
      .select({
        teamId: historicalPoints.teamId,
        played: historicalPoints.played,
        points: historicalPoints.points,
      })
      .from(historicalPoints)
      // The averages take the two seasons before this one.
      .where(between(historicalPoints.season, currentSeason.season - 2, currentSeason.season - 1)),
  ]);
  // The goals only feed the scorers table, which this page does not show.
  return buildSeasonMap(
    { teams: teamRows, matches: league, groups, goals: [], history },
    cup,
    currentSeason,
    new Date(),
  );
}

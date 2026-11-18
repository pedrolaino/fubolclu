import { and, asc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { matchEvents, matches, providerStandings, teams } from "@/db/schema";
import { currentSeason } from "@/config/seasons";
import { buildTeam } from "@/lib/team";

// A match as lib/team reads it, without the stats.
export const teamMatchColumns = {
  id: matches.id,
  competition: matches.competition,
  roundLabel: matches.roundLabel,
  phase: matches.phase,
  tournament: matches.tournament,
  matchday: matches.matchday,
  kickoff: matches.kickoff,
  providerKickoff: matches.providerKickoff,
  status: matches.status,
  homeTeamId: matches.homeTeamId,
  awayTeamId: matches.awayTeamId,
  homeGoals: matches.homeGoals,
  awayGoals: matches.awayGoals,
  homePenalties: matches.homePenalties,
  awayPenalties: matches.awayPenalties,
  detailsSyncedAt: matches.detailsSyncedAt,
};

export async function teamSlugs() {
  return db.select({ slug: teams.slug }).from(teams);
}

// A team's page: its table position, results and scorers. Null for an unknown slug.
export async function loadTeam(slug: string) {
  "use cache";
  const [team] = await db.select().from(teams).where(eq(teams.slug, slug));
  if (!team) return null;
  const season = currentSeason.season;
  const [teamRows, matchRows, groups, goals] = await Promise.all([
    db.select().from(teams),
    db.select(teamMatchColumns).from(matches).where(eq(matches.season, season)),
    db
      .select({
        competition: providerStandings.competition,
        groupName: providerStandings.groupName,
        teamId: providerStandings.teamId,
      })
      .from(providerStandings)
      .where(eq(providerStandings.season, season)),
    db
      .select({
        playerId: matchEvents.playerId,
        playerName: matchEvents.playerName,
        teamId: matchEvents.teamId,
        type: matchEvents.type,
      })
      .from(matchEvents)
      .innerJoin(matches, eq(matchEvents.matchId, matches.id))
      .where(
        and(
          eq(matches.season, season),
          eq(matchEvents.teamId, team.id),
          or(eq(matches.homeTeamId, team.id), eq(matches.awayTeamId, team.id)),
          inArray(matchEvents.type, ["goal", "penalty_goal"]),
        ),
      )
      .orderBy(asc(matches.kickoff), asc(matchEvents.minute)),
  ]);
  return buildTeam(
    team.id,
    { teams: teamRows, matches: matchRows, groups, goals },
    currentSeason.competitions,
    new Date(),
  );
}

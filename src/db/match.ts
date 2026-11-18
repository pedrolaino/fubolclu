import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { matchEvents, matches, teams } from "@/db/schema";
import { buildMatch } from "@/lib/match";

// A few recent matches to prerender; the rest render on first request.
export async function sampleMatchIds(count: number) {
  const rows = await db
    .select({ id: matches.id })
    .from(matches)
    .orderBy(desc(matches.kickoff))
    .limit(count);
  return rows.map((r) => r.id);
}

// A match with its events and statistics. Null for an unknown id.
export async function loadMatch(id: number) {
  "use cache";
  const [match] = await db.select().from(matches).where(eq(matches.id, id));
  if (!match) return null;
  const [pair, events, round] = await Promise.all([
    db
      .select()
      .from(teams)
      .where(inArray(teams.id, [match.homeTeamId, match.awayTeamId])),
    db
      .select({
        teamId: matchEvents.teamId,
        type: matchEvents.type,
        playerName: matchEvents.playerName,
        assistPlayerName: matchEvents.assistPlayerName,
        minute: matchEvents.minute,
        extraMinute: matchEvents.extraMinute,
      })
      .from(matchEvents)
      .where(eq(matchEvents.matchId, id))
      .orderBy(asc(matchEvents.id)),
    db
      .select({
        competition: matches.competition,
        roundLabel: matches.roundLabel,
        status: matches.status,
        kickoff: matches.kickoff,
        providerKickoff: matches.providerKickoff,
      })
      .from(matches)
      .where(
        and(
          eq(matches.competition, match.competition),
          eq(matches.season, match.season),
          eq(matches.roundLabel, match.roundLabel),
        ),
      ),
  ]);
  return buildMatch({
    match,
    home: pair.find((t) => t.id === match.homeTeamId)!,
    away: pair.find((t) => t.id === match.awayTeamId)!,
    events,
    round,
  });
}

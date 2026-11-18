import { and, between, eq, sql } from "drizzle-orm";
import { teamInfo } from "@/config/teams";
import { db } from "@/db";
import {
  apiUsage,
  matchEvents,
  matches,
  players,
  providerStandings,
  syncRuns,
  syncState,
  teams,
  type Competition,
} from "@/db/schema";
import type { MatchDetail, MatchPage, Standing, Team } from "@/lib/provider";
import type { PlannedMatch } from "./plan";
import { teamSlugs } from "./slugs";

export async function upsertTeams(list: Team[]) {
  if (!list.length) return;
  const unique = [...new Map(list.map((t) => [t.id, t])).values()].map((t) => ({
    ...t,
    name: teamInfo[t.id]?.name ?? t.name,
  }));
  const slugs = teamSlugs(
    unique,
    await db.select({ id: teams.id, name: teams.name, slug: teams.slug }).from(teams),
  );
  await db
    .insert(teams)
    .values(
      unique.map((t) => ({ id: t.id, name: t.name, slug: slugs.get(t.id)!, logoUrl: t.logoUrl })),
    )
    .onConflictDoUpdate({
      target: teams.id,
      set: {
        name: sql`excluded.name`,
        slug: sql`excluded.slug`,
        logoUrl: sql`coalesce(excluded.logo_url, ${teams.logoUrl})`,
      },
    });
}

const matchColumns = [
  "competition",
  "season",
  "roundLabel",
  "tournament",
  "phase",
  "matchday",
  "providerKickoff",
  "homeTeamId",
  "awayTeamId",
  "homeGoals",
  "awayGoals",
  "homePenalties",
  "awayPenalties",
  "updatedAt",
] as const;

const excluded = (keys: readonly (keyof typeof matches.$inferInsert & keyof typeof matches)[]) => ({
  ...Object.fromEntries(keys.map((k) => [k, sql.raw(`excluded.${matches[k].name}`)])),
  // A kickoff TheSportsDB corrected stays until the match starts.
  kickoff: sql`case when ${matches.kickoff} <> ${matches.providerKickoff}
    and ${matches.status} = 'scheduled' and excluded.status = 'scheduled'
    then ${matches.kickoff} else excluded.kickoff end`,
});

export async function upsertMatchPage(page: MatchPage, now: Date) {
  await upsertTeams(page.teams);
  const rows = page.matches.map((m) => ({
    ...m,
    providerKickoff: m.kickoff,
    status: m.status ?? "scheduled",
    updatedAt: now,
  }));
  const known = rows.filter((_, i) => page.matches[i].status !== null);
  const unknown = rows.filter((_, i) => page.matches[i].status === null);
  if (known.length) {
    await db
      .insert(matches)
      .values(known)
      .onConflictDoUpdate({ target: matches.id, set: excluded([...matchColumns, "status"]) });
  }
  // Unknown provider status: keep whatever status we stored before.
  if (unknown.length) {
    await db
      .insert(matches)
      .values(unknown)
      .onConflictDoUpdate({ target: matches.id, set: excluded(matchColumns) });
  }
}

export async function saveDetail(matchId: number, detail: MatchDetail, now: Date) {
  const people = new Map<number, string>();
  for (const e of detail.events) {
    if (e.playerId !== null) people.set(e.playerId, e.playerName);
    if (e.assistPlayerId !== null) people.set(e.assistPlayerId, e.assistPlayerName ?? "");
  }
  await db.transaction(async (tx) => {
    if (people.size) {
      await tx
        .insert(players)
        .values([...people].map(([id, name]) => ({ id, name })))
        .onConflictDoUpdate({
          target: players.id,
          set: { name: sql`coalesce(nullif(excluded.name, ''), ${players.name})` },
        });
    }
    await tx.delete(matchEvents).where(eq(matchEvents.matchId, matchId));
    if (detail.events.length) {
      await tx.insert(matchEvents).values(detail.events.map((e) => ({ ...e, matchId })));
    }
    await tx
      .update(matches)
      .set({ stats: detail.stats, detailsSyncedAt: now })
      .where(eq(matches.id, matchId));
  });
}

export async function replaceStandings(
  competition: Competition,
  season: number,
  standings: Standing[],
) {
  await upsertTeams(standings.map((s) => s.team));
  await db.transaction(async (tx) => {
    await tx
      .delete(providerStandings)
      .where(
        and(eq(providerStandings.competition, competition), eq(providerStandings.season, season)),
      );
    if (standings.length) {
      await tx
        .insert(providerStandings)
        .values(
          standings.map(({ team, ...s }) => ({ ...s, competition, season, teamId: team.id })),
        );
    }
  });
}

export async function plannedMatches(season: number): Promise<PlannedMatch[]> {
  return db
    .select({
      id: matches.id,
      competition: matches.competition,
      kickoff: matches.kickoff,
      status: matches.status,
      detailsSyncedAt: matches.detailsSyncedAt,
    })
    .from(matches)
    .where(eq(matches.season, season));
}

export async function loadStamps() {
  const rows = await db.select().from(syncState);
  return Object.fromEntries(rows.map((r) => [r.key, r.syncedAt]));
}

export async function setStamp(key: string, at: Date) {
  await db
    .insert(syncState)
    .values({ key, syncedAt: at })
    .onConflictDoUpdate({ target: syncState.key, set: { syncedAt: at } });
}

export async function requestsOn(day: string) {
  const [row] = await db.select().from(apiUsage).where(eq(apiUsage.day, day));
  return row?.requests ?? 0;
}

export async function countRequest(day: string) {
  await db
    .insert(apiUsage)
    .values({ day, requests: 1 })
    .onConflictDoUpdate({ target: apiUsage.day, set: { requests: sql`${apiUsage.requests} + 1` } });
}

export async function startRun(at: Date) {
  const [run] = await db
    .insert(syncRuns)
    .values({ startedAt: at, requestsUsed: 0, status: "running" })
    .returning({ id: syncRuns.id });
  return run.id;
}

export async function finishRun(
  id: number,
  requestsUsed: number,
  error?: unknown,
  status = error ? "error" : "ok",
) {
  await db
    .update(syncRuns)
    .set({ finishedAt: new Date(), requestsUsed, status, error: error ? String(error) : null })
    .where(eq(syncRuns.id, id));
}

// Only one sync runs at a time, so a row still running belongs to a job that was killed.
export async function closeStaleRuns() {
  await db
    .update(syncRuns)
    .set({ status: "error", error: "Interrupted: the job ended before finishing the run" })
    .where(eq(syncRuns.status, "running"));
}

// Not started, in the next weeks or just past a placeholder kickoff.
export async function upcomingMatches(season: number, now: Date) {
  const day = 24 * 60 * 60 * 1000;
  return db
    .select({
      id: matches.id,
      competition: matches.competition,
      phase: matches.phase,
      matchday: matches.matchday,
      roundLabel: matches.roundLabel,
      homeTeamId: matches.homeTeamId,
      awayTeamId: matches.awayTeamId,
      kickoff: matches.kickoff,
      providerKickoff: matches.providerKickoff,
    })
    .from(matches)
    .where(
      and(
        eq(matches.season, season),
        eq(matches.status, "scheduled"),
        between(
          matches.providerKickoff,
          new Date(now.getTime() - 2 * day),
          new Date(now.getTime() + 45 * day),
        ),
      ),
    );
}

export async function setKickoffs(changes: { id: number; kickoff: Date }[], now: Date) {
  for (const { id, kickoff } of changes) {
    await db.update(matches).set({ kickoff, updatedAt: now }).where(eq(matches.id, id));
  }
}

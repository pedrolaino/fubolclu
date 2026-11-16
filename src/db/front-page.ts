import { and, between, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { currentSeason } from "@/config/seasons";
import { db } from "@/db";
import { matches, teams } from "@/db/schema";
import { teamMatchColumns } from "@/db/team";
import { buildFrontPage } from "@/lib/front-page";

const week = 7 * 24 * 60 * 60 * 1000;

// Last week's and next week's matches of every competition.
// Cached until the sync revalidates the "data" tag, so "now" is the time of the last refresh.
export async function loadFrontPage() {
  "use cache";
  cacheTag("data");
  const now = new Date();
  const [teamRows, matchRows] = await Promise.all([
    db.select().from(teams),
    db
      .select(teamMatchColumns)
      .from(matches)
      .where(
        and(
          eq(matches.season, currentSeason.season),
          between(matches.kickoff, new Date(now.getTime() - week), new Date(now.getTime() + week)),
        ),
      ),
  ]);
  return buildFrontPage({ teams: teamRows, matches: matchRows }, now);
}

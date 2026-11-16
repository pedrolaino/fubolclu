import { and, between, eq } from "drizzle-orm";
import { currentSeason } from "@/config/seasons";
import { db } from "@/db";
import { matches, teams } from "@/db/schema";
import { teamMatchColumns } from "@/db/team";
import { buildFrontPage } from "@/lib/front-page";

const week = 7 * 24 * 60 * 60 * 1000;

// Last week's and next week's matches of every competition.
// Cached with the default lifetime (revalidated every 15 minutes), so "now" is at most that old.
export async function loadFrontPage() {
  "use cache";
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

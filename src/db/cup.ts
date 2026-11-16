import { and, eq } from "drizzle-orm";
import { currentSeason } from "@/config/seasons";
import { db } from "@/db";
import { matches, teams } from "@/db/schema";
import { buildCup } from "@/lib/cup";

// The bracket of the Copa Argentina. Cached with the default lifetime (revalidated every 15 minutes).
export async function loadCup() {
  "use cache";
  const [teamRows, matchRows] = await Promise.all([
    db.select().from(teams),
    db
      .select()
      .from(matches)
      .where(
        and(eq(matches.competition, "copa-argentina"), eq(matches.season, currentSeason.season)),
      ),
  ]);
  return buildCup({ teams: teamRows, matches: matchRows });
}

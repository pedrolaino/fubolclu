import { and, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { currentSeason } from "@/config/seasons";
import { db } from "@/db";
import { matches, teams } from "@/db/schema";
import { buildCup } from "@/lib/cup";

// The bracket of the Copa Argentina, cached until the sync revalidates the "data" tag.
export async function loadCup() {
  "use cache";
  cacheTag("data");
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

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { historicalPoints } from "@/db/schema";
import { upsertTeams } from "@/lib/sync/store";
import rows from "./historical-points.json";

// Top-flight league play per team: 2024 = Liga Profesional + Copa de la Liga tables,
// 2025 = both league phases computed from the provider's matches.
async function seed() {
  await upsertTeams(rows.map((r) => ({ id: r.teamId, name: r.name, logoUrl: null })));
  await db
    .insert(historicalPoints)
    .values(rows.map(({ teamId, season, played, points }) => ({ teamId, season, played, points })))
    .onConflictDoUpdate({
      target: [historicalPoints.season, historicalPoints.teamId],
      set: { played: sql`excluded.played`, points: sql`excluded.points` },
    });
  console.log(`Seeded ${rows.length} historical point rows`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());

import { db } from "@/db";
import { highlightly } from "@/lib/provider/highlightly";
import { sync } from "@/lib/sync/run";

sync(highlightly, { dryRun: process.argv.includes("--dry-run") })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());

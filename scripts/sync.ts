import { db } from "@/db";
import { highlightly } from "@/lib/provider/highlightly";
import { sync, syncKickoffs } from "@/lib/sync/run";

const dryRun = process.argv.includes("--dry-run");

// One after the other, and a failed Highlightly run doesn't keep the kickoffs from updating.
async function main() {
  for (const step of dryRun
    ? [() => sync(highlightly, { dryRun })]
    : [() => sync(highlightly), syncKickoffs]) {
    try {
      await step();
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    }
  }
}

main().finally(() => db.$client.end());

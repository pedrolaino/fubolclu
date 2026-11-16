import { currentSeason } from "@/config/seasons";
import { PAGE_SIZE, type FootballProvider } from "@/lib/provider";
import { plan, type Call } from "./plan";
import {
  countRequest,
  finishRun,
  loadStamps,
  plannedMatches,
  replaceStandings,
  requestsOn,
  saveDetail,
  setStamp,
  startRun,
  upsertMatchPage,
} from "./store";

// The free plan allows 100 a day; the rest is headroom for manual calls.
export const DAILY_LIMIT = 90;

const describe = (c: Call) =>
  c.kind === "detail"
    ? `detail ${c.competition} ${c.matchId}`
    : c.kind === "standings"
      ? `standings ${c.competition}`
      : `${c.kind} ${c.competition} offset=${c.offset}`;

// Returns the next page when a full list turns out longer than planned.
async function execute(call: Call, provider: FootballProvider, now: Date): Promise<Call | null> {
  const competition = currentSeason.competitions.find((c) => c.competition === call.competition)!;
  const season = currentSeason.season;
  if (call.kind === "detail") {
    await saveDetail(call.matchId, await provider.matchDetail(call.matchId), now);
  } else if (call.kind === "standings") {
    await replaceStandings(call.competition, season, await provider.standings(competition, season));
    await setStamp(call.stamp, now);
  } else {
    const page = await provider.listMatches(competition, season, call.offset);
    await upsertMatchPage(page, now);
    if (call.kind === "matches" && call.stamp && call.offset + PAGE_SIZE < page.total) {
      return { ...call, offset: call.offset + PAGE_SIZE };
    }
    if (call.stamp) await setStamp(call.stamp, now);
  }
  return null;
}

export async function sync(provider: FootballProvider, { dryRun = false } = {}) {
  const now = new Date();
  // The provider's quota resets at 00:00 UTC.
  const day = now.toISOString().slice(0, 10);
  const used = await requestsOn(day);
  const budget = Math.max(0, DAILY_LIMIT - used);
  const calls = plan({
    now,
    budget,
    season: currentSeason,
    matches: await plannedMatches(currentSeason.season),
    stamps: await loadStamps(),
  });
  console.log(`${day}: ${used}/${DAILY_LIMIT} requests used, ${calls.length} planned`);
  if (dryRun) {
    calls.forEach((c) => console.log(describe(c)));
    return;
  }
  if (!calls.length) return;

  const runId = await startRun(now);
  let made = 0;
  try {
    for (let call = calls.shift(); call && made < budget; call = calls.shift()) {
      console.log(describe(call));
      // Counted before the request so failed ones count too.
      await countRequest(day);
      made++;
      const next = await execute(call, provider, now);
      if (next) calls.unshift(next);
    }
  } catch (error) {
    await finishRun(runId, made, error);
    throw error;
  }
  await finishRun(runId, made);
}

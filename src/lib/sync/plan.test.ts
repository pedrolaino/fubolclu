import { describe, expect, it } from "vitest";
import { season2026 } from "@/config/seasons/2026";
import type { Competition, MatchStatus } from "@/db/schema";
import { plan, type PlanInput, type PlannedMatch } from "./plan";

const now = new Date("2026-11-16T20:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);

function matches(
  competition: Competition,
  count: number,
  status: MatchStatus = "finished",
  synced = true,
): PlannedMatch[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    competition,
    // One match a day, newest first, all more than a day old.
    kickoff: hoursAgo(48 + i * 24),
    status,
    detailsSyncedAt: synced ? hoursAgo(1) : null,
  }));
}

const syncedToday = {
  "matches:liga-profesional:2026": hoursAgo(10),
  "matches:primera-nacional:2026": hoursAgo(10),
  "matches:copa-argentina:2026": hoursAgo(10),
  "standings:liga-profesional:2026": hoursAgo(10),
  "standings:primera-nacional:2026": hoursAgo(10),
};

function input(overrides: Partial<PlanInput>): PlanInput {
  return { now, budget: 90, season: season2026, matches: [], stamps: syncedToday, ...overrides };
}

describe("plan", () => {
  it("does nothing when everything is fresh", () => {
    expect(plan(input({ matches: matches("liga-profesional", 300) }))).toEqual([]);
  });

  it("refreshes every list and standings on an empty database", () => {
    expect(plan(input({ stamps: {} }))).toEqual([
      {
        kind: "matches",
        competition: "liga-profesional",
        offset: 0,
        stamp: "matches:liga-profesional:2026",
      },
      {
        kind: "matches",
        competition: "primera-nacional",
        offset: 0,
        stamp: "matches:primera-nacional:2026",
      },
      {
        kind: "matches",
        competition: "copa-argentina",
        offset: 0,
        stamp: "matches:copa-argentina:2026",
      },
      {
        kind: "standings",
        competition: "liga-profesional",
        stamp: "standings:liga-profesional:2026",
      },
      {
        kind: "standings",
        competition: "primera-nacional",
        stamp: "standings:primera-nacional:2026",
      },
    ]);
  });

  it("refreshes a full list once per UTC day, one page per hundred known matches", () => {
    const stamps = {
      ...syncedToday,
      "matches:liga-profesional:2026": new Date("2026-11-15T23:59Z"),
    };
    const calls = plan(input({ stamps, matches: matches("liga-profesional", 503) }));
    expect(calls).toEqual(
      [0, 100, 200, 300, 400, 500].map((offset) => ({
        kind: "matches",
        competition: "liga-profesional",
        offset,
        ...(offset === 500 && { stamp: "matches:liga-profesional:2026" }),
      })),
    );
  });

  it("fetches the page holding a match that kicked off in the last three hours", () => {
    const list = matches("primera-nacional", 250);
    // The list is newest first: 120 later matches put the live one on the second page.
    for (let i = 0; i < 120; i++)
      list[i] = { ...list[i], kickoff: new Date("2026-12-01T00:00Z"), status: "scheduled" };
    list[200] = { ...list[200], kickoff: hoursAgo(1), status: "live" };
    expect(plan(input({ matches: list }))).toEqual([
      {
        kind: "recent",
        competition: "primera-nacional",
        offset: 100,
        stamp: "recent:primera-nacional:2026",
      },
    ]);
  });

  it("fetches both pages when matches with the same kickoff straddle a page boundary", () => {
    const list = matches("liga-profesional", 150).map((m, i) =>
      i < 95
        ? { ...m, kickoff: new Date("2026-12-01T00:00Z"), status: "scheduled" as const }
        : i < 105
          ? { ...m, kickoff: hoursAgo(2), status: "scheduled" as const }
          : m,
    );
    expect(plan(input({ matches: list })).map((c) => c.kind === "recent" && c.offset)).toEqual([
      0, 100,
    ]);
  });

  it("retries matches with missing results at most every three hours", () => {
    const list = matches("liga-profesional", 10);
    list[0] = { ...list[0], kickoff: hoursAgo(6), status: "live" };
    const recent = (h: number) => ({ ...syncedToday, "recent:liga-profesional:2026": hoursAgo(h) });
    expect(plan(input({ matches: list, stamps: recent(1) }))).toEqual([]);
    expect(plan(input({ matches: list, stamps: recent(4) }))).toHaveLength(1);
  });

  it("ignores unfinished matches older than a day", () => {
    const list = matches("liga-profesional", 10);
    list[0] = { ...list[0], kickoff: hoursAgo(30), status: "scheduled" };
    expect(plan(input({ matches: list }))).toEqual([]);
  });

  it("fetches details of finished matches by competition priority, newest first", () => {
    const list = [
      ...matches("copa-argentina", 1, "finished", false),
      ...matches("primera-nacional", 2, "finished", false),
      ...matches("liga-profesional", 2, "finished", false).map((m) => ({ ...m, id: m.id + 100 })),
      {
        id: 200,
        competition: "liga-profesional" as const,
        kickoff: hoursAgo(1),
        status: "finished" as const,
        detailsSyncedAt: null,
      },
      {
        id: 201,
        competition: "liga-profesional" as const,
        kickoff: hoursAgo(5),
        status: "postponed" as const,
        detailsSyncedAt: null,
      },
    ];
    expect(plan(input({ matches: list }))).toEqual([
      { kind: "detail", competition: "liga-profesional", matchId: 101 },
      { kind: "detail", competition: "liga-profesional", matchId: 102 },
      { kind: "detail", competition: "primera-nacional", matchId: 1 },
      { kind: "detail", competition: "primera-nacional", matchId: 2 },
      { kind: "detail", competition: "copa-argentina", matchId: 1 },
    ]);
  });

  describe("budget", () => {
    const list = matches("liga-profesional", 503, "finished", false);
    const stamps = { ...syncedToday, "matches:liga-profesional:2026": hoursAgo(30) };

    it("stops at the remaining budget", () => {
      const calls = plan(input({ matches: list, stamps, budget: 8 }));
      expect(calls.map((c) => c.kind)).toEqual([...Array(6).fill("matches"), "detail", "detail"]);
    });

    it("skips a list refresh that does not fit and spends the rest on cheaper calls", () => {
      const calls = plan(input({ matches: list, stamps, budget: 5 }));
      expect(calls.map((c) => c.kind)).toEqual(Array(5).fill("detail"));
    });

    it("plans nothing without budget", () => {
      expect(plan(input({ matches: list, stamps, budget: 0 }))).toEqual([]);
    });
  });
});

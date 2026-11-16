import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FootballProvider } from "@/lib/provider";
import type { Call } from "./plan";
import { DAILY_LIMIT, sync } from "./run";
import * as store from "./store";

vi.mock("./plan", async (original) => ({
  ...(await original<typeof import("./plan")>()),
  plan: vi.fn(() => calls.slice()),
}));
vi.mock("./store", () => ({
  closeStaleRuns: vi.fn(),
  countRequest: vi.fn(async (day: string) => usage.set(day, (usage.get(day) ?? 0) + 1)),
  finishRun: vi.fn(),
  loadStamps: vi.fn(async () => ({})),
  plannedMatches: vi.fn(async () => []),
  replaceStandings: vi.fn(),
  requestsOn: vi.fn(async (day: string) => usage.get(day) ?? 0),
  saveDetail: vi.fn(),
  setStamp: vi.fn(),
  startRun: vi.fn(async () => 7),
  upsertMatchPage: vi.fn(),
}));

let calls: Call[] = [];
let usage = new Map<string, number>();
const detail = (matchId: number): Call => ({
  kind: "detail",
  competition: "liga-profesional",
  matchId,
});
const recent: Call = {
  kind: "recent",
  competition: "liga-profesional",
  offset: 0,
  stamp: "recent:liga-profesional:2026",
};

function provider(failing: number[] = []): FootballProvider {
  return {
    listMatches: vi.fn(async () => ({ matches: [], teams: [], total: 0 })),
    matchDetail: vi.fn(async (id: number) => {
      if (failing.includes(id)) throw new Error(`no detail for ${id}`);
      return { events: [], stats: null };
    }),
    standings: vi.fn(async () => []),
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-16T20:00:00Z"));
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  usage = new Map();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("sync", () => {
  it("records a failed detail and carries on with the others", async () => {
    calls = [detail(1), detail(2), detail(3)];
    const p = provider([1]);
    await sync(p);
    expect(p.matchDetail).toHaveBeenCalledTimes(3);
    expect(store.saveDetail).toHaveBeenCalledTimes(2);
    expect(store.setStamp).toHaveBeenCalledWith("detail-failed:1", expect.any(Date));
    expect(usage.get("2026-11-16")).toBe(3);
    expect(store.finishRun).toHaveBeenCalledWith(
      7,
      3,
      expect.stringContaining("no detail for 1"),
      "partial",
    );
  });

  it("ends the run after three failed calls in a row", async () => {
    calls = [detail(1), detail(2), detail(3), detail(4), detail(5)];
    const p = provider([2, 3, 4]);
    await expect(sync(p)).rejects.toThrow("no detail for 4");
    expect(p.matchDetail).toHaveBeenCalledTimes(4);
    expect(store.finishRun).toHaveBeenCalledWith(7, 4, expect.any(Error));
  });

  it("still aborts on a failed list call", async () => {
    calls = [recent, detail(1)];
    const p = provider();
    vi.mocked(p.listMatches).mockRejectedValue(new Error("down"));
    await expect(sync(p)).rejects.toThrow("down");
    expect(p.matchDetail).not.toHaveBeenCalled();
  });

  it("counts requests after midnight against the new day and its budget", async () => {
    vi.setSystemTime(new Date("2026-11-16T23:59:59Z"));
    usage.set("2026-11-16", DAILY_LIMIT - 3);
    usage.set("2026-11-17", DAILY_LIMIT - 1);
    calls = [detail(1), detail(2), detail(3)];
    const p = provider();
    vi.mocked(p.matchDetail).mockImplementationOnce(async () => {
      vi.setSystemTime(new Date("2026-11-17T00:00:01Z"));
      return { events: [], stats: null };
    });
    await sync(p);
    expect(usage.get("2026-11-16")).toBe(DAILY_LIMIT - 2);
    expect(usage.get("2026-11-17")).toBe(DAILY_LIMIT);
    expect(p.matchDetail).toHaveBeenCalledTimes(2);
  });

  it("closes runs left running by a killed job before starting", async () => {
    calls = [detail(1)];
    await sync(provider());
    expect(store.closeStaleRuns).toHaveBeenCalled();
    expect(vi.mocked(store.closeStaleRuns).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(store.startRun).mock.invocationCallOrder[0],
    );
  });
});

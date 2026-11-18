import { describe, expect, it, vi } from "vitest";
import { sportsDbTeams } from "@/config/sports-db";
import round from "@/lib/provider/fixtures/sportsdb-round.json";
import { parseRound, type ScheduledEvent } from "@/lib/provider/sportsdb";
import { confirmedKickoffs, findKickoff, roundNumbers, type Upcoming } from "./kickoffs";

const ours = (sportsDbId: number) =>
  Number(Object.entries(sportsDbTeams).find(([, id]) => id === sportsDbId)![0]);
const placeholder = new Date("2026-11-22T21:00:00Z");
const events = parseRound(round);

// Vélez - Belgrano and Boca - Independiente Rivadavia, round of 16 of the 2026 Clausura.
const upcoming = (home: number, away: number, extra: Partial<Upcoming> = {}): Upcoming => ({
  id: home,
  competition: "liga-profesional",
  phase: "knockout",
  matchday: null,
  roundLabel: "Round of 16",
  homeTeamId: ours(home),
  awayTeamId: ours(away),
  kickoff: placeholder,
  providerKickoff: placeholder,
  ...extra,
});
const velez = upcoming(135179, 135155);
const boca = upcoming(135156, 137777);

describe("parseRound", () => {
  it("reads the timestamps as UTC", () => {
    expect(events).toHaveLength(8);
    expect(events[0]).toEqual({
      home: 135179,
      away: 135155,
      kickoff: new Date("2026-11-20T23:00:00Z"),
    });
  });
});

describe("roundNumbers", () => {
  it("uses the matchday for league rounds and TheSportsDB's codes for knockouts", () => {
    expect(roundNumbers({ phase: "league", matchday: 9, roundLabel: "Clausura - 9" })).toEqual([9]);
    expect(
      roundNumbers({ phase: "knockout", matchday: null, roundLabel: "Apertura - Semi-finals" }),
    ).toEqual([150, 4]);
    expect(roundNumbers({ phase: "knockout", matchday: null, roundLabel: "Repechaje" })).toEqual(
      [],
    );
  });
});

describe("findKickoff", () => {
  it("finds the match by its two teams", () => {
    expect(findKickoff(velez, events)).toEqual(new Date("2026-11-20T23:00:00Z"));
    expect(findKickoff(boca, events)).toEqual(new Date("2026-11-26T00:00:00Z"));
  });

  it("takes the closer match when a round number covers both tournaments", () => {
    const apertura: ScheduledEvent = { ...events[0], kickoff: new Date("2026-05-10T20:00:00Z") };
    expect(findKickoff(velez, [apertura, events[0]])).toEqual(events[0].kickoff);
  });

  it("ignores a day without a time", () => {
    const midnight: ScheduledEvent = { ...events[0], kickoff: new Date("2026-11-21T03:00:00Z") };
    expect(findKickoff(velez, [midnight])).toBeNull();
  });
});

describe("confirmedKickoffs", () => {
  it("asks for each round once and returns only what changes", async () => {
    const fetchRound = vi.fn(async (_c: string, r: number) => (r === 160 ? events : []));
    const settled = upcoming(135171, 135165, { kickoff: new Date("2026-11-22T22:00:00Z") });
    const changes = await confirmedKickoffs([velez, boca, settled], fetchRound);
    expect(fetchRound).toHaveBeenCalledTimes(1);
    expect(changes).toEqual([
      { id: velez.id, kickoff: new Date("2026-11-20T23:00:00Z") },
      { id: boca.id, kickoff: new Date("2026-11-26T00:00:00Z") },
    ]);
  });

  it("tries the older round number when the first has nothing", async () => {
    const fetchRound = vi.fn(async (_c: string, r: number) => (r === 16 ? events : []));
    const changes = await confirmedKickoffs([velez], fetchRound);
    expect(fetchRound.mock.calls.map(([, r]) => r)).toEqual([160, 16]);
    expect(changes).toHaveLength(1);
  });
});

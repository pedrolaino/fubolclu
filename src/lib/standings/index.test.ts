import { describe, expect, it } from "vitest";
import { season2025 } from "@/config/seasons/2025";
import { season2026 } from "@/config/seasons/2026";
import { toProviderPage } from "@/lib/provider/fixtures/compact";
import lpf2025 from "@/lib/provider/fixtures/lpf-2025-league.json";
import lpf2026 from "@/lib/provider/fixtures/lpf-2026-league.json";
import providerStandings from "@/lib/provider/fixtures/standings-2026.json";
import { parseMatchPage, parseStandings } from "@/lib/provider/highlightly";
import {
  annualTable,
  averagesTable,
  form,
  positionHistory,
  scorers,
  table,
  zoneTable,
  type StandingsMatch,
} from ".";

const now = new Date("2026-11-16T01:00:00Z");

function match(
  homeTeamId: number,
  awayTeamId: number,
  homeGoals: number,
  awayGoals: number,
  matchday = 1,
): StandingsMatch {
  return {
    homeTeamId,
    awayTeamId,
    homeGoals,
    awayGoals,
    status: "finished",
    phase: "league",
    tournament: "apertura",
    matchday,
    kickoff: new Date(Date.UTC(2026, 0, matchday)),
  };
}

const teams = [
  { id: 1, name: "Alpha" },
  { id: 2, name: "Bravo" },
  { id: 3, name: "Charlie" },
  { id: 4, name: "Delta" },
];

describe("table", () => {
  it("counts only finished matches of the given teams", () => {
    const rows = table(
      [match(1, 2, 2, 0), match(3, 9, 1, 1), { ...match(1, 3, 5, 0), status: "scheduled" }],
      teams,
    );
    expect(rows.map((r) => r.teamId)).toEqual([1, 3, 4, 2]);
    expect(rows[0]).toEqual({
      teamId: 1,
      played: 1,
      won: 1,
      drawn: 0,
      lost: 0,
      goalsFor: 2,
      goalsAgainst: 0,
      points: 3,
    });
    expect(rows[1]).toMatchObject({ played: 1, drawn: 1, points: 1 });
  });

  it("breaks ties by goal difference, then goals for", () => {
    const rows = table([match(1, 4, 1, 0), match(2, 4, 3, 2), match(3, 4, 2, 0)], teams);
    expect(rows.map((r) => r.teamId)).toEqual([3, 2, 1, 4]);
  });

  it("breaks remaining ties by head-to-head points among the tied teams, then name", () => {
    // Bravo and Charlie both end on 3 points, 0 difference, 2 goals; Charlie won their match.
    const rows = table([match(2, 3, 0, 1), match(2, 1, 2, 1), match(3, 4, 1, 2)], teams);
    expect(rows.map((r) => r.teamId)).toEqual([4, 3, 2, 1]);

    const rows2 = table(
      [match(2, 1, 1, 0), match(4, 3, 1, 0), match(1, 4, 0, 0), match(3, 2, 0, 0)],
      teams,
    );
    // Bravo and Delta never met, nor did Alpha and Charlie, so name decides.
    expect(rows2.map((r) => r.teamId)).toEqual([2, 4, 1, 3]);
  });
});

describe("2026 zone tables", () => {
  const { matches, teams } = parseMatchPage(
    toProviderPage(lpf2026),
    season2026.competitions[0],
    2026,
    now,
  );
  const provider = parseStandings(providerStandings);
  const groups = Object.groupBy(provider, (s) => s.groupName);

  it.each(Object.keys(groups))("%s matches the provider table", (name) => {
    const expected = groups[name]!;
    const tournament = name.startsWith("Apertura") ? "apertura" : "clausura";
    const zone = teams.filter((t) => expected.some((s) => s.team.id === t.id));
    const rows = zoneTable(matches, tournament, zone);
    expect(rows).toEqual(
      expected.map(({ team, played, won, drawn, lost, goalsFor, goalsAgainst, points }) => ({
        teamId: team.id,
        played,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        points,
      })),
    );
  });
});

describe("annualTable", () => {
  it("adds up both 2025 league phases", () => {
    const { matches, teams } = parseMatchPage(
      toProviderPage(lpf2025),
      season2025.competitions[0],
      2025,
      now,
    );
    const rows = annualTable(matches, teams);
    expect(rows).toHaveLength(30);
    expect(rows[0]).toMatchObject({ teamId: 372671, played: 32, points: 66 });
    expect(rows[1]).toMatchObject({ teamId: 384585, played: 32, points: 62 });
  });

  it("ignores knockout matches", () => {
    const rows = annualTable(
      [match(1, 2, 1, 0), { ...match(2, 1, 3, 0), phase: "knockout" }],
      teams,
    );
    expect(rows[0]).toMatchObject({ teamId: 1, played: 1, points: 3 });
  });
});

describe("averagesTable", () => {
  it("divides points by games over all seasons given, lowest last", () => {
    const rows = averagesTable(
      [
        { teamId: 1, played: 27, points: 40 },
        { teamId: 1, played: 32, points: 50 },
        { teamId: 2, played: 32, points: 30 },
        { teamId: 3, played: 32, points: 45 },
      ],
      teams.slice(0, 3),
    );
    expect(rows).toEqual([
      { teamId: 1, played: 59, points: 90, average: 90 / 59 },
      { teamId: 3, played: 32, points: 45, average: 45 / 32 },
      { teamId: 2, played: 32, points: 30, average: 30 / 32 },
    ]);
  });

  it("lists teams without games after those with an average", () => {
    const rows = averagesTable([{ teamId: 2, played: 32, points: 0 }], teams.slice(0, 3));
    expect(rows.map((r) => [r.teamId, r.played])).toEqual([
      [2, 32],
      [1, 0],
      [3, 0],
    ]);
  });
});

describe("scorers", () => {
  it("counts goals and penalties but not own goals", () => {
    const rows = scorers([
      { playerId: 10, playerName: "Uno", teamId: 1, type: "goal" },
      { playerId: 10, playerName: "Uno", teamId: 1, type: "penalty_goal" },
      { playerId: 20, playerName: "Dos", teamId: 2, type: "goal" },
      { playerId: 30, playerName: "Tres", teamId: 2, type: "own_goal" },
      { playerId: 20, playerName: "Dos", teamId: 2, type: "yellow_card" },
      { playerId: null, playerName: "Sin Id", teamId: 3, type: "goal" },
    ]);
    expect(rows).toEqual([
      { playerId: 10, playerName: "Uno", teamId: 1, goals: 2, penalties: 1 },
      { playerId: 20, playerName: "Dos", teamId: 2, goals: 1, penalties: 0 },
      { playerId: null, playerName: "Sin Id", teamId: 3, goals: 1, penalties: 0 },
    ]);
  });
});

describe("form", () => {
  it("returns the last five finished results, oldest first", () => {
    const matches = [
      match(1, 2, 1, 0, 1),
      match(3, 1, 1, 0, 2),
      match(1, 4, 2, 2, 3),
      match(2, 1, 0, 3, 4),
      match(1, 3, 0, 0, 5),
      match(4, 1, 1, 0, 6),
      { ...match(1, 2, 0, 0, 7), status: "scheduled" as const },
    ];
    expect(form(matches, 1)).toEqual(["L", "D", "W", "D", "L"]);
  });
});

describe("positionHistory", () => {
  it("returns the team's position after each matchday", () => {
    const matches = [
      match(1, 2, 1, 0, 1),
      match(3, 4, 0, 0, 1),
      match(2, 1, 2, 0, 2),
      match(4, 3, 0, 3, 2),
    ];
    expect(positionHistory(matches, teams, 1)).toEqual([
      { matchday: 1, position: 1 },
      { matchday: 2, position: 3 },
    ]);
  });
});

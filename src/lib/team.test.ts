import { describe, expect, it } from "vitest";
import { season2026 } from "@/config/seasons/2026";
import { buildTeam, competitionName, type TeamData, type TeamMatch } from "./team";

const now = new Date("2026-08-10T12:00:00Z");

const names = ["Instituto", "Boca Juniors", "River Plate", "Racing", "Lanús", "Estudiantes"];
const teams = names.map((name, i) => ({
  id: 100 + i,
  name,
  slug: name.toLowerCase().replace(/\W+/g, "-"),
  logoUrl: null,
}));
const zone = (letter: string, ids: number[]) =>
  ids.map((teamId) => ({
    competition: "liga-profesional" as const,
    groupName: `Clausura - Group ${letter}`,
    teamId,
  }));
const groups = [...zone("A", [100, 101, 104]), ...zone("B", [102, 103, 105])];

let nextId = 1;
function match(
  home: number,
  away: number,
  score: [number, number] | null,
  day: number,
  extra: Partial<TeamMatch> = {},
): TeamMatch {
  return {
    id: nextId++,
    competition: "liga-profesional",
    roundLabel: `Clausura - ${day}`,
    homeTeamId: home,
    awayTeamId: away,
    homeGoals: score?.[0] ?? null,
    awayGoals: score?.[1] ?? null,
    homePenalties: null,
    awayPenalties: null,
    status: score ? "finished" : "scheduled",
    phase: "league",
    tournament: "clausura",
    matchday: day,
    kickoff: new Date(Date.UTC(2026, 7, day, 21)),
    detailsSyncedAt: null,
    ...extra,
  };
}

function data(matches: TeamMatch[], extra: Partial<TeamData> = {}): TeamData {
  return { teams, matches, groups, goals: [], ...extra };
}

const build = (id: number, d: TeamData) => buildTeam(id, d, season2026.competitions, now)!;

describe("buildTeam", () => {
  it("is null for a team that is not in the data", () => {
    expect(buildTeam(999, data([]), season2026.competitions, now)).toBeNull();
  });

  it("places the team in its zone and charts its position by matchday", () => {
    const view = build(
      100,
      data([
        match(100, 101, [2, 0], 1),
        match(104, 100, [1, 1], 2),
        match(101, 104, [0, 3], 2, { homeGoals: 0, awayGoals: 3 }),
        match(100, 104, null, 20),
      ]),
    );
    expect(view.standing).toMatchObject({
      zone: "la Zona A del Clausura",
      position: 2,
      size: 3,
      spots: null,
      record: { played: 2, won: 1, drawn: 1, lost: 0, goalsFor: 3, goalsAgainst: 1, points: 4 },
    });
    expect(view.standing!.history).toEqual([
      { matchday: 1, position: 1 },
      { matchday: 2, position: 2 },
    ]);
    expect(view.summary).toBe(
      "Es 2º en la Zona A del Clausura con 4 puntos. El jueves 20 de agosto recibe a Lanús por la fecha 20 del Clausura.",
    );
  });

  it("orders upcoming first, then results newest first, from the team's side", () => {
    const view = build(
      100,
      data([
        match(100, 101, [2, 0], 1),
        match(102, 100, [3, 1], 2),
        match(100, 104, null, 20),
        match(100, 103, null, 12, {
          competition: "copa-argentina",
          phase: "knockout",
          tournament: null,
        }),
      ]),
    );
    expect(view.upcoming.map((f) => f.rival.name)).toEqual(["Racing", "Lanús"]);
    expect(view.results.map((f) => [f.rival.name, f.home, f.result])).toEqual([
      ["River Plate", false, "L"],
      ["Boca Juniors", true, "W"],
    ]);
    expect(view.upcoming[0].competition).toBe("Copa Argentina");
    expect(view.results[1].round).toBe("Fecha 1");
  });

  it("has no table for a team outside the leagues", () => {
    const cup = (home: number, away: number, score: [number, number] | null, day: number) =>
      match(home, away, score, day, {
        competition: "copa-argentina",
        phase: "knockout",
        tournament: null,
        roundLabel: "Round of 64",
        matchday: null,
      });
    const view = build(105, data([cup(105, 100, [0, 2], 1)], { groups: [] }));
    expect(view.standing).toBeNull();
    expect(view.scorers).toBeNull();
    expect(view.summary).toBe(
      "Juega la Copa Argentina. En su último partido perdió 2-0 con Instituto.",
    );
  });

  it("counts the team's own goals scored, notes missing match details", () => {
    const goal = (playerName: string, teamId: number, type = "goal" as const) => ({
      playerId: null,
      playerName,
      teamId,
      type,
    });
    const view = build(
      100,
      data(
        [
          match(100, 101, [2, 0], 1, { detailsSyncedAt: now }),
          match(102, 100, [3, 1], 2),
          match(100, 104, [1, 0], 3, { status: "finished" }),
        ],
        {
          goals: [
            goal("Ruiz", 100),
            goal("Ruiz", 100, "goal"),
            goal("Soto", 100),
            goal("Rival", 101),
          ],
        },
      ),
    );
    expect(view.scorers!.rows).toEqual([
      { playerName: "Ruiz", goals: 2, penalties: 0 },
      { playerName: "Soto", goals: 1, penalties: 0 },
    ]);
    expect(view.scorers!.note).toBe("Con los goles de 1 de los 3 partidos jugados.");
  });
});

it("names the competition of a match", () => {
  expect(competitionName({ competition: "liga-profesional", tournament: "apertura" })).toBe(
    "Apertura",
  );
  expect(competitionName({ competition: "primera-nacional", tournament: null })).toBe(
    "Primera Nacional",
  );
});

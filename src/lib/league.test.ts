import { describe, expect, it } from "vitest";
import { season2026 } from "@/config/seasons/2026";
import { buildLeague, roundName, type LeagueData, type LeagueMatch } from "./league";

const config = season2026.competitions[0];
const now = new Date("2026-08-10T12:00:00Z");

const teams = [
  { id: 407562, name: "Instituto", slug: "instituto", logoUrl: null },
  { id: 384585, name: "Boca Juniors", slug: "boca-juniors", logoUrl: null },
  { id: 370969, name: "River Plate", slug: "river-plate", logoUrl: null },
  { id: 371820, name: "Racing", slug: "racing", logoUrl: null },
];
const groups = [
  { groupName: "Clausura - Group A", teamId: 407562 },
  { groupName: "Clausura - Group A", teamId: 384585 },
  { groupName: "Clausura - Group B", teamId: 370969 },
  { groupName: "Clausura - Group B", teamId: 371820 },
];

let nextId = 1;
function match(home: number, away: number, score: [number, number] | null, day: number) {
  return {
    id: nextId++,
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
    detailsSyncedAt: score ? new Date() : null,
  } satisfies LeagueMatch;
}

function data(matches: LeagueMatch[], extra: Partial<LeagueData> = {}): LeagueData {
  return { teams, groups, matches, goals: [], history: [], ...extra };
}

describe("roundName", () => {
  it("names league matchdays and knockout rounds", () => {
    expect(roundName({ roundLabel: "Clausura - 16", phase: "league", matchday: 16 })).toBe(
      "Fecha 16",
    );
    expect(roundName({ roundLabel: "Round of 16", phase: "knockout", matchday: null })).toBe(
      "Octavos de final",
    );
    expect(
      roundName({ roundLabel: "Apertura - Semi-finals", phase: "knockout", matchday: null }),
    ).toBe("Semifinales");
    expect(roundName({ roundLabel: "Super Final", phase: "knockout", matchday: null })).toBe(
      "Final",
    );
  });
});

describe("buildLeague", () => {
  const played = [
    match(407562, 384585, [2, 0], 1),
    match(370969, 371820, [1, 1], 1),
    match(384585, 370969, [3, 1], 2),
    match(371820, 407562, [0, 1], 2),
  ];

  it("makes one tab per zone of the current tournament, then annual, averages and scorers", () => {
    const goals = [{ playerId: 1, playerName: "Uno", teamId: 407562, type: "goal" as const }];
    const { tabs } = buildLeague(data(played, { goals }), config, now);
    expect(tabs.map((t) => t.key)).toEqual([
      "zona-a",
      "zona-b",
      "anual",
      "promedios",
      "goleadores",
    ]);
    expect(tabs[0].label).toBe("Zona A");
    expect(buildLeague(data(played), config, now).tabs).toHaveLength(4);
  });

  it("says who leads a zone, by how much, and their next match", () => {
    const upcoming = match(407562, 370969, null, 12);
    const { tabs } = buildLeague(data([...played, upcoming]), config, now);
    expect(tabs[0].subject.name).toBe("Instituto");
    expect(tabs[0].summary).toBe(
      "Lidera la Zona A del Clausura con 6 puntos, 3 más que Boca Juniors. El miércoles 12 de agosto recibe a River Plate por la fecha 12.",
    );
  });

  it("says the zone is won once every league match is played", () => {
    const { tabs } = buildLeague(data(played), config, now);
    expect(tabs[0].summary).toBe("Ganó la Zona A del Clausura con 6 puntos.");
  });

  it("draws the line under the playoff places", () => {
    const { tabs } = buildLeague(data(played), { ...config, playoffSpots: 1 }, now);
    expect(tabs[0].kind === "table" && tabs[0].lines).toEqual([1]);
  });

  it("builds averages from past seasons plus this one, worst team as the subject", () => {
    const history = [
      { teamId: 407562, played: 32, points: 30 },
      { teamId: 384585, played: 32, points: 62 },
      { teamId: 370969, played: 32, points: 53 },
      { teamId: 371820, played: 32, points: 53 },
    ];
    const tab = buildLeague(data(played, { history }), config, now).tabs[3];
    expect(tab.subject.name).toBe("Instituto");
    expect(tab.kind === "averages" && tab.rows.at(-1)).toMatchObject({ played: 34, points: 36 });
    expect(tab.summary).toBe(
      "Tiene el peor promedio de la categoría: 1,059. Si termina así, desciende.",
    );
  });

  it("puts the top scorer's team in charge of the scorers tab", () => {
    const goals = [
      { playerId: 1, playerName: "Eduardo Salvio", teamId: 371820, type: "goal" as const },
      { playerId: 1, playerName: "Eduardo Salvio", teamId: 371820, type: "penalty_goal" as const },
      { playerId: 2, playerName: "Otro", teamId: 384585, type: "goal" as const },
    ];
    const tab = buildLeague(data(played, { goals }), config, now).tabs[4];
    expect(tab.title).toBe("Eduardo Salvio");
    expect(tab.subject.name).toBe("Racing");
    expect(tab.summary).toBe("Lleva 2 goles en la temporada, 1 de penal. Juega en Racing.");
  });

  it("splits matches into the latest played round and the next one", () => {
    const upcoming = match(407562, 370969, null, 12);
    const { latest, next } = buildLeague(data([...played, upcoming]), config, now);
    expect(latest?.title).toBe("Fecha 2");
    expect(latest?.matches).toHaveLength(2);
    expect(next?.title).toBe("Fecha 12");
    expect(next?.matches[0].home.name).toBe("Instituto");
  });
});

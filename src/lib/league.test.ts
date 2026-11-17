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

describe("buildLeague without tournaments", () => {
  const nacional = season2026.competitions[1];
  const zones = [
    { groupName: "Group 1", teamId: 407562 },
    { groupName: "Group 1", teamId: 384585 },
    { groupName: "Group 2", teamId: 370969 },
    { groupName: "Group 2", teamId: 371820 },
  ];
  const played = [match(407562, 384585, [2, 0], 1), match(370969, 371820, [1, 1], 1)].map((m) => ({
    ...m,
    roundLabel: "Regular Season - 1",
    tournament: null,
  }));

  it("names the zones after the provider's groups, without a tournament", () => {
    const { tabs } = buildLeague(data(played, { groups: zones }), nacional, now);
    expect(tabs.map((t) => t.key)).toEqual(["zona-a", "zona-b"]);
    expect(tabs[0].summary).toBe("Ganó la Zona A con 3 puntos.");
    expect(tabs[1].summary).toBe("Ganó la Zona B con 1 punto.");
  });

  it("keeps the notes of both lines", () => {
    const { tabs } = buildLeague(data(played, { groups: zones }), nacional, now);
    expect(tabs[0].notes).toHaveLength(2);
    expect(tabs[0].notes[1]).toContain("descienden");
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
    const zoneLines = [{ top: 1, note: "juegan" }];
    const { tabs } = buildLeague(data(played), { ...config, zoneLines }, now);
    expect(tabs[0].kind === "table" && tabs[0].lines).toEqual([1]);
    expect(tabs[0].notes).toEqual(["juegan"]);
  });

  it("counts a bottom line from the last row of each zone", () => {
    const zoneLines = [{ bottom: 1, note: "descienden" }];
    const { tabs } = buildLeague(data(played), { ...config, zoneLines }, now);
    expect(tabs[0].kind === "table" && tabs[0].lines).toEqual([1]);
  });

  it("keeps the line note of the Liga Profesional", () => {
    const { tabs } = buildLeague(data(played), config, now);
    expect(tabs[0].notes).toEqual(["Sobre la línea, los 8 que juegan los octavos de final."]);
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
      "Terminó con el peor promedio de la categoría: 1,059. Desciende a la Primera Nacional.",
    );
    const open = buildLeague(
      data([...played, match(407562, 370969, null, 12)], { history }),
      config,
      now,
    ).tabs[3];
    expect(open.summary).toBe(
      "Tiene el peor promedio de la categoría: 1,059. Si termina así, desciende.",
    );
  });

  it("moves the annual relegation line up when the last also has the worst average", () => {
    const small = { ...config, annual: { libertadores: 1, relegated: 1 } };
    const annualOf = (history: LeagueData["history"]) => {
      const tab = buildLeague(data(played, { history }), small, now).tabs[2];
      if (tab.kind !== "table") throw new Error("annual tab expected");
      return tab;
    };
    const plain = annualOf([]);
    const last = plain.rows.at(-1)!.team.id;
    const other = plain.rows[0].team.id;
    const bad = (teamId: number) => [{ teamId, played: 64, points: 0 }];

    expect(annualOf(bad(other)).lines).toEqual([1, 3]);
    const both = annualOf(bad(last));
    expect(both.lines).toEqual([1, 2]);
    expect(both.notes[1]).toMatch(/por la tabla anual baja el anteúltimo/);
  });

  it("keeps a zone open while a match of its teams is postponed", () => {
    const postponed = { ...match(370969, 371820, null, 9), status: "postponed" as const };
    const { tabs } = buildLeague(data([...played, postponed]), config, now);
    expect(tabs[1].summary).toBe(
      "Lidera la Zona B del Clausura con 1 punto, igualado con River Plate.",
    );
    expect(tabs[2].summary).toMatch(/^Lidera la tabla anual/);
  });

  it("names as next match only one that is still ahead or under way", () => {
    const stale = { ...match(407562, 370969, null, 9), status: "live" as const };
    const postponed = { ...match(407562, 371820, null, 10), status: "postponed" as const };
    const { tabs } = buildLeague(data([...played, stale, postponed]), config, now);
    expect(tabs[0].summary).toBe(
      "Lidera la Zona A del Clausura con 6 puntos, 3 más que Boca Juniors.",
    );
    const live = { ...match(407562, 370969, null, 10), status: "live" as const, kickoff: now };
    expect(buildLeague(data([...played, live]), config, now).tabs[0].summary).toMatch(
      /recibe a River Plate por la fecha 10\.$/,
    );
  });
  // The round of 16 before it is scheduled: every match at the same placeholder kickoff.
  const octavos = (pairs: [number, number][]) =>
    pairs.map(([home, away]) => ({
      ...match(home, away, null, 22),
      roundLabel: "Round of 16",
      phase: "knockout" as const,
      matchday: null,
    }));
  const four = octavos([
    [407562, 370969],
    [384585, 371820],
    [370969, 384585],
    [371820, 407562],
  ]);

  it("gives no date for a next match whose kickoff is a placeholder", () => {
    const { tabs, next } = buildLeague(data([...played, ...four]), config, now);
    expect(tabs[0].summary).toBe(
      "Ganó la Zona A del Clausura con 6 puntos. Recibe a River Plate por los octavos de final; todavía no tiene fecha confirmada.",
    );
    expect(next?.day).toBe("Días y horarios a confirmar");
    expect(next?.matches.every((m) => m.unconfirmed)).toBe(true);
  });

  it("keeps the date when only three matches share the kickoff", () => {
    const { tabs, next } = buildLeague(data([...played, ...four.slice(0, 3)]), config, now);
    expect(tabs[0].summary).toMatch(
      /El sábado 22 de agosto recibe a River Plate por los octavos de final\.$/,
    );
    expect(next?.day).toBe("sábado 22 de agosto");
    expect(next?.matches.some((m) => m.unconfirmed)).toBe(false);
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

describe("buildLeague before anything is played", () => {
  const history = [
    { teamId: 407562, played: 32, points: 30 },
    { teamId: 384585, played: 32, points: 62 },
    { teamId: 370969, played: 32, points: 53 },
  ];
  const fixtures = [match(407562, 384585, null, 12), match(370969, 371820, null, 12)];

  it("claims no leader or winner for a table where nobody has played", () => {
    // With no matches at all there is no tournament to name.
    for (const [matches, zone] of [
      [fixtures, "la Zona A del Clausura"],
      [[], "la Zona A"],
    ] as const) {
      const { tabs } = buildLeague(data([...matches], { history }), config, now);
      expect(tabs[0].title).toBe("Boca Juniors");
      expect(tabs[0].summary).toBe(`Todavía no se jugó ningún partido de ${zone}.`);
      expect(tabs[2].summary).toBe("Todavía no se jugó ningún partido de la tabla anual.");
    }
  });

  it("gives no average to a team without games and leaves it out of the worst", () => {
    const tab = buildLeague(data(fixtures, { history }), config, now).tabs[3];
    expect(tab.kind === "averages" && tab.rows.map((r) => r.team.name)).toEqual([
      "Boca Juniors",
      "River Plate",
      "Instituto",
      "Racing",
    ]);
    expect(tab.subject.name).toBe("Instituto");
    expect(tab.summary).toBe(
      "Tiene el peor promedio de la categoría: 0,938. Si termina así, desciende.",
    );
    const none = buildLeague(data(fixtures), config, now).tabs[3];
    expect(none.summary).toBe("Todavía no se jugó ningún partido que cuente para los promedios.");
  });
});

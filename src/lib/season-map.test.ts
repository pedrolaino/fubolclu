import { describe, expect, it } from "vitest";
import { season2026 } from "@/config/seasons/2026";
import type { LeagueData, LeagueMatch } from "./league";
import { buildSeasonMap, describeTeam } from "./season-map";

const config = { ...season2026.competitions[0], annual: { libertadores: 3, relegated: 1 } };
const now = new Date("2026-11-16T12:00:00Z");

const teams = ["Alfa", "Bravo", "Charly", "Delta", "Eco", "Foxtrot"].map((name, i) => ({
  id: i + 1,
  name,
  slug: name.toLowerCase(),
  logoUrl: null,
}));
const groups = [
  ...[1, 2, 3].map((teamId) => ({ groupName: "Clausura - Group A", teamId })),
  ...[4, 5, 6].map((teamId) => ({ groupName: "Clausura - Group B", teamId })),
];

let nextId = 1;
function match(
  home: number,
  away: number,
  score: [number, number] | null,
  extra: Partial<LeagueMatch> = {},
): LeagueMatch {
  return {
    id: nextId++,
    roundLabel: "Clausura - 1",
    homeTeamId: home,
    awayTeamId: away,
    homeGoals: score?.[0] ?? null,
    awayGoals: score?.[1] ?? null,
    homePenalties: null,
    awayPenalties: null,
    status: score ? "finished" : "scheduled",
    phase: "league",
    tournament: "clausura",
    matchday: 1,
    kickoff: new Date(Date.UTC(2026, 9, nextId)),
    detailsSyncedAt: null,
    ...extra,
  };
}

const knockout = (
  home: number,
  away: number,
  score: [number, number] | null,
  roundLabel: string,
  extra: Partial<LeagueMatch> = {},
) => match(home, away, score, { phase: "knockout", matchday: null, roundLabel, ...extra });

const apertura = { tournament: "apertura" as const };
const sunday = new Date("2026-11-22T21:00:00Z");
const leagueMatches = [
  match(1, 2, [1, 0], apertura),
  match(3, 4, [1, 0], apertura),
  match(5, 6, [1, 0], apertura),
  match(1, 3, [2, 0]),
  match(2, 4, [1, 0]),
  match(6, 5, [0, 1]),
];
// Bravo wins the Apertura on penalties; the Clausura round of 16 is still to be played.
const tournaments = [
  knockout(1, 2, [1, 1], "Apertura - Final", { ...apertura, homePenalties: 4, awayPenalties: 5 }),
  knockout(1, 2, null, "Round of 16", { kickoff: sunday }),
  knockout(3, 4, null, "Round of 16", { kickoff: sunday }),
];
const cup = [
  knockout(1, 3, [2, 0], "Semi-finals", { tournament: null }),
  knockout(5, 4, [1, 0], "Semi-finals", { tournament: null }),
];

function build(matches: LeagueMatch[], history: LeagueData["history"] = []) {
  return buildSeasonMap({ teams, groups, matches, goals: [], history }, cup, config, now)!;
}
const seat = (map: ReturnType<typeof build>, key: string) => map.seats.find((s) => s.key === key)!;
const names = (entries: { team: { name: string } }[]) => entries.map((e) => e.team.name);

describe("buildSeasonMap", () => {
  const map = build([...leagueMatches, ...tournaments]);

  it("takes the champion from goals, then penalties", () => {
    const apertura = seat(map, "campeon-apertura");
    expect(apertura.state).toBe("decided");
    expect(names(apertura.entries)).toEqual(["Bravo"]);
    expect(apertura.line).toBe("Ganó la final 1 a 1 (5 a 4 en los penales) contra Alfa.");
  });

  it("leaves a tournament open while it has teams alive", () => {
    const clausura = seat(map, "campeon-clausura");
    expect(clausura.state).toBe("open");
    expect(clausura.entries).toHaveLength(4);
    expect(clausura.line).toBe(
      "Siguen vivos 4 equipos. Los octavos de final se juegan el domingo 22 de noviembre.",
    );
  });

  it("names the cup finalists while the final is not played", () => {
    const copa = seat(map, "copa-argentina");
    expect(copa.state).toBe("open");
    expect(names(copa.entries).sort()).toEqual(["Alfa", "Eco"]);
    expect(copa.line).toBe("Ya están los dos finalistas y la final todavía no tiene fecha.");
  });

  it("skips teams that already hold a place down the annual table", () => {
    // Annual order: Alfa, Eco, Bravo, Charly. Bravo is the Apertura champion, so Charly gets the third place.
    expect(map.libertadores.map((s) => [s.door, s.team?.name ?? null])).toEqual([
      ["apertura", "Bravo"],
      ["clausura", null],
      ["copa-argentina", null],
      ["anual", "Alfa"],
      ["anual", "Eco"],
      ["anual", "Charly"],
    ]);
  });

  it("decides the league title and relegation once no league match is pending", () => {
    expect(seat(map, "campeon-liga").state).toBe("decided");
    expect(names(seat(map, "campeon-liga").entries)).toEqual(["Alfa"]);
    const pending = build([...leagueMatches, match(2, 3, null), ...tournaments]);
    expect(seat(pending, "campeon-liga").state).toBe("today");
    expect(seat(pending, "descenso-anual").state).toBe("today");
  });

  it("flags the same team going down by both tables", () => {
    expect(names(seat(map, "descenso-anual").entries)).toEqual(["Foxtrot"]);
    expect(names(seat(map, "descenso-promedio").entries)).toEqual(["Foxtrot"]);
    expect(map.notes).toEqual([
      "Foxtrot está último en la tabla anual y también tiene el peor promedio, así que ocupa un solo lugar de descenso.",
    ]);
  });

  it("takes the worst average from the history too", () => {
    const other = build(
      [...leagueMatches, ...tournaments],
      [{ teamId: 6, played: 30, points: 60 }],
    );
    expect(names(seat(other, "descenso-promedio").entries)).toEqual(["Delta"]);
    expect(other.notes).toEqual([]);
  });

  it("waits for the Clausura champion to fill the Trofeo de Campeones", () => {
    expect(map.trofeo?.teams.map((t) => t?.name ?? null)).toEqual(["Bravo", null]);
  });

  it("leads the hero with the annual leader", () => {
    expect(map.leader.name).toBe("Alfa");
    expect(map.summary).toMatch(/^Terminó primero en la tabla anual con 6 puntos/);
  });
});

describe("describeTeam", () => {
  const map = build([...leagueMatches, ...tournaments]);

  it("writes where a team stands", () => {
    expect(describeTeam(map, 1)).toBe(
      "Alfa es Campeón de Liga, ya está en la Libertadores 2027 por la tabla anual y sigue vivo en el Clausura y en la Copa Argentina.",
    );
    expect(describeTeam(map, 2)).toBe(
      "Bravo ya está en la Libertadores 2027 como campeón del Apertura, va al Trofeo de Campeones y sigue vivo en el Clausura.",
    );
    expect(describeTeam(map, 6)).toBe(
      "Foxtrot desciende a la Primera Nacional: es el último de la tabla anual y también tiene el peor promedio.",
    );
  });

  it("says when a team is in no seat", () => {
    expect(describeTeam(build(leagueMatches), 4)).toBe(
      "Delta no está en ninguna plaza por ahora: ni de Libertadores ni de descenso.",
    );
  });
});

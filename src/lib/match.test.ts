import { describe, expect, it } from "vitest";
import { buildMatch, type MatchData } from "./match";

const home = { id: 1, name: "Instituto", slug: "instituto", logoUrl: null };
const away = { id: 2, name: "Newell's", slug: "newells", logoUrl: null };

const base: MatchData = {
  match: {
    id: 10,
    competition: "liga-profesional",
    roundLabel: "Clausura - 16",
    phase: "league",
    tournament: "clausura",
    matchday: 16,
    kickoff: new Date("2026-11-08T21:00:00Z"),
    status: "finished",
    homeTeamId: 1,
    awayTeamId: 2,
    homeGoals: 2,
    awayGoals: 1,
    homePenalties: null,
    awayPenalties: null,
    detailsSyncedAt: new Date("2026-11-09T12:00:00Z"),
    stats: null,
  },
  home,
  away,
  events: [],
};

const withMatch = (m: Partial<MatchData["match"]>): MatchData => ({
  ...base,
  match: { ...base.match, ...m },
});

describe("buildMatch hero", () => {
  it("tells who won and the score", () => {
    const view = buildMatch(base);
    expect(view.title).toBe("2-1");
    expect(view.summary).toBe(
      "Instituto le ganó 2-1 a Newell's por la fecha 16 del Clausura, el domingo 8 de noviembre.",
    );
    expect(buildMatch(withMatch({ homeGoals: 0, awayGoals: 3 })).summary).toBe(
      "Newell's le ganó 3-0 a Instituto por la fecha 16 del Clausura, el domingo 8 de noviembre.",
    );
    expect(buildMatch(withMatch({ homeGoals: 1, awayGoals: 1 })).summary).toBe(
      "Instituto y Newell's empataron 1-1 por la fecha 16 del Clausura, el domingo 8 de noviembre.",
    );
  });

  it("says who went through on penalties", () => {
    const view = buildMatch(
      withMatch({
        competition: "copa-argentina",
        phase: "knockout",
        tournament: null,
        roundLabel: "Round of 16",
        matchday: null,
        homeGoals: 1,
        awayGoals: 1,
        homePenalties: 3,
        awayPenalties: 4,
      }),
    );
    expect(view.title).toBe("1-1");
    expect(view.summary).toBe(
      "Instituto y Newell's empataron 1-1 por los octavos de final de la Copa Argentina, el domingo 8 de noviembre, y Newell's ganó 4-3 en los penales.",
    );
  });

  it("shows the kickoff time before the match", () => {
    const view = buildMatch(
      withMatch({
        status: "scheduled",
        homeGoals: null,
        awayGoals: null,
        detailsSyncedAt: null,
        phase: "knockout",
        roundLabel: "Round of 16",
        matchday: null,
        kickoff: new Date("2026-11-22T21:00:00Z"),
      }),
    );
    expect(view.title).toBe("18:00");
    expect(view.summary).toBe(
      "Instituto recibe a Newell's el domingo 22 de noviembre a las 18:00 por los octavos de final del Clausura.",
    );
  });

  it("says when a match was postponed", () => {
    const view = buildMatch(withMatch({ status: "postponed", homeGoals: null, awayGoals: null }));
    expect(view.summary).toBe(
      "Instituto y Newell's iban a jugar el domingo 8 de noviembre por la fecha 16 del Clausura, pero el partido se postergó.",
    );
  });
});

describe("buildMatch timeline", () => {
  it("orders events, sides them and words them", () => {
    const e = (over: Partial<MatchData["events"][number]>): MatchData["events"][number] => ({
      teamId: 1,
      type: "goal",
      playerName: "Ruiz",
      assistPlayerName: null,
      minute: 10,
      extraMinute: null,
      ...over,
    });
    const view = buildMatch({
      ...base,
      events: [
        e({ type: "yellow_card", teamId: 2, playerName: "Soto", minute: 90, extraMinute: 3 }),
        e({ type: "substitution", playerName: "Gil", assistPlayerName: "Paz", minute: 60 }),
        e({ type: "goal", assistPlayerName: "Paz", minute: 10 }),
        // Credited to the other team.
        e({ type: "own_goal", teamId: 2, playerName: "Vera", minute: 30 }),
      ],
    });
    expect(view.events.map((x) => [x.minute, x.side, x.title, x.detail])).toEqual([
      ["10'", "home", "Gol", "Ruiz, asistencia de Paz"],
      ["30'", "home", "Gol en contra", "Vera"],
      ["60'", "home", "Cambio", "Entra Paz por Gil"],
      ["90+3'", "away", "Amarilla", "Soto"],
    ]);
  });
});

describe("buildMatch stats", () => {
  const team = (id: number, values: Record<string, number>) => ({
    team: { id },
    statistics: Object.entries(values).map(([displayName, value]) => ({ displayName, value })),
  });

  it("pairs the chosen figures by team, whichever order they come in", () => {
    const view = buildMatch(
      withMatch({
        stats: [
          team(2, {
            Possession: 0.4,
            "Shots on target": 2,
            "Shots off target": 3,
            "Blocked shots": 0,
            "Expected Goals": 0.756,
            "Successful passes": 80,
            "Total passes": 100,
          }),
          team(1, {
            Possession: 0.6,
            "Shots on target": 6,
            "Shots off target": 4,
            "Blocked shots": 2,
            "Expected Goals": 1.5,
            "Successful passes": 150,
            "Total passes": 200,
          }),
        ],
      }),
    );
    const row = (label: string) => view.stats.find((s) => s.label === label)!;
    expect(row("Posesión")).toMatchObject({ homeText: "60%", awayText: "40%" });
    expect(row("Remates")).toMatchObject({ homeText: "12", awayText: "5" });
    expect(row("Goles esperados")).toMatchObject({ homeText: "1,50", awayText: "0,76" });
    expect(row("Precisión de pases")).toMatchObject({ homeText: "75%", awayText: "80%" });
    // Bars scale to the larger side for counts.
    expect(row("Remates al arco")).toMatchObject({ homeShare: 1, awayShare: 1 / 3 });
    // Figures the provider didn't send are left out.
    expect(view.stats.map((s) => s.label)).not.toContain("Córners");
  });

  it("ignores stats that are not in the expected shape", () => {
    expect(buildMatch(withMatch({ stats: { nope: true } })).stats).toEqual([]);
    expect(buildMatch(withMatch({ stats: [{ team: { id: 1 } }] })).stats).toEqual([]);
  });
});

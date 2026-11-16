import { describe, expect, it } from "vitest";
import type { TeamMatch } from "./team";
import { buildFrontPage } from "./front-page";

const now = new Date("2026-11-16T15:00:00Z");

const names = ["Godoy Cruz", "Tristán Suárez", "Boca Juniors", "Banfield", "Instituto", "Huracán"];
const teams = names.map((name, i) => ({
  id: 100 + i,
  name,
  slug: name.toLowerCase().replace(/\W+/g, "-"),
  logoUrl: null,
}));
const [godoy, tristan, boca, banfield, instituto, huracan] = teams.map((t) => t.id);

let nextId = 1;
// A finished knockout match `daysAgo` days before now, 20:00 UTC.
function knockout(
  competition: TeamMatch["competition"],
  roundLabel: string,
  home: number,
  away: number,
  score: [number, number],
  daysAgo: number,
  extra: Partial<TeamMatch> = {},
): TeamMatch {
  return {
    id: nextId++,
    competition,
    roundLabel,
    homeTeamId: home,
    awayTeamId: away,
    homeGoals: score[0],
    awayGoals: score[1],
    homePenalties: null,
    awayPenalties: null,
    status: "finished",
    phase: "knockout",
    tournament: competition === "liga-profesional" ? "clausura" : null,
    matchday: null,
    kickoff: new Date(Date.UTC(2026, 10, 16 - daysAgo, 20)),
    detailsSyncedAt: null,
    ...extra,
  };
}

const build = (matches: TeamMatch[]) => buildFrontPage({ teams, matches }, now);

describe("buildFrontPage lead", () => {
  it("puts a top-flight or cup result before any of the Primera Nacional", () => {
    const { lead } = build([
      knockout("copa-argentina", "Semi-finals", banfield, boca, [0, 3], 2),
      knockout("primera-nacional", "Super Final", godoy, tristan, [3, 1], 1),
      knockout("primera-nacional", "Round of 16", instituto, huracan, [2, 0], 0),
    ]);
    expect(lead?.subject.name).toBe("Boca Juniors");
    expect(lead?.title).toBe("Boca Juniors");
    expect(lead?.summary).toBe(
      "Le ganó 3-0 a Banfield en las semifinales de la Copa Argentina el sábado 14 de noviembre. Pasa a la final.",
    );
  });

  it("gives the cover to the Primera Nacional only when the others have no result", () => {
    const { lead } = build([
      knockout("primera-nacional", "Super Final", godoy, tristan, [3, 1], 1),
      knockout("primera-nacional", "Round of 16", instituto, huracan, [2, 0], 0),
      knockout("copa-argentina", "Semi-finals", banfield, boca, [0, 3], 9),
    ]);
    expect(lead?.subject.name).toBe("Godoy Cruz");
    expect(lead?.summary).toBe(
      "Le ganó 3-1 a Tristán Suárez en la final de la Primera Nacional el domingo 15 de noviembre. Es el campeón y el primer ascenso a la Liga Profesional.",
    );
  });

  it("orders top-flight and cup results by stage before kickoff", () => {
    const { lead } = build([
      knockout("liga-profesional", "Quarter-finals", instituto, huracan, [2, 0], 0),
      knockout("copa-argentina", "Semi-finals", banfield, boca, [0, 3], 2),
    ]);
    expect(lead?.subject.name).toBe("Boca Juniors");
  });

  it("ignores matches older than a week and unfinished or undecided ones", () => {
    const { lead } = build([
      knockout("copa-argentina", "Final", boca, banfield, [1, 0], 8),
      knockout("primera-nacional", "Final", godoy, tristan, [1, 1], 1),
      knockout("liga-profesional", "Final", instituto, huracan, [0, 0], 1, {
        status: "scheduled",
      }),
      knockout("copa-argentina", "Quarter-finals", banfield, huracan, [2, 1], 3),
    ]);
    expect(lead?.subject.name).toBe("Banfield");
    expect(lead?.summary).toBe(
      "Le ganó 2-1 a Huracán en los cuartos de final de la Copa Argentina el viernes 13 de noviembre. Pasa a las semifinales.",
    );
  });

  it("breaks ties on stage by the latest kickoff, then by competition", () => {
    const later = build([
      knockout("copa-argentina", "Semi-finals", banfield, boca, [0, 3], 1),
      knockout("liga-profesional", "Semi-finals", instituto, huracan, [2, 0], 2),
    ]);
    expect(later.lead?.subject.name).toBe("Boca Juniors");

    const sameTime = build([
      knockout("copa-argentina", "Semi-finals", banfield, boca, [0, 3], 1),
      knockout("primera-nacional", "Semi-finals", godoy, tristan, [1, 0], 1),
      knockout("liga-profesional", "Semi-finals", instituto, huracan, [2, 0], 1),
    ]);
    expect(sameTime.lead?.subject.name).toBe("Instituto");
  });

  it("decides a draw on penalties", () => {
    const { lead } = build([
      knockout("liga-profesional", "Final", instituto, huracan, [1, 1], 1, {
        homePenalties: 3,
        awayPenalties: 4,
      }),
    ]);
    expect(lead?.subject.name).toBe("Huracán");
    expect(lead?.summary).toBe(
      "Empató 1-1 con Instituto en la final del Clausura el domingo 15 de noviembre y ganó 4-3 por penales. Es el campeón del Clausura.",
    );
  });

  it("leaves out a shoot-out with level penalties", () => {
    const { lead } = build([
      knockout("liga-profesional", "Final", instituto, huracan, [1, 1], 1, {
        homePenalties: 4,
        awayPenalties: 4,
      }),
    ]);
    expect(lead).toBeNull();
  });

  it("names the Copa Argentina champion and says nothing more after another final", () => {
    expect(
      build([knockout("copa-argentina", "Final", boca, banfield, [2, 0], 1)]).lead?.summary,
    ).toBe(
      "Le ganó 2-0 a Banfield en la final de la Copa Argentina el domingo 15 de noviembre. Es el campeón de la Copa Argentina.",
    );
    // The Reducido's final is not the title decider.
    expect(
      build([knockout("primera-nacional", "Final", godoy, tristan, [2, 0], 1)]).lead?.summary,
    ).toBe(
      "Le ganó 2-0 a Tristán Suárez en la final de la Primera Nacional el domingo 15 de noviembre.",
    );
  });

  it("is null when no knockout match finished in the last week", () => {
    expect(build([]).lead).toBeNull();
  });
});

describe("buildFrontPage matches", () => {
  const league = (home: number, away: number, kickoff: string, extra: Partial<TeamMatch> = {}) =>
    knockout("liga-profesional", "Round of 16", home, away, [0, 0], 0, {
      status: "scheduled",
      homeGoals: null,
      awayGoals: null,
      kickoff: new Date(kickoff),
      ...extra,
    });

  it("lists the next week's matches by day and round, soonest first", () => {
    const { upcoming } = build([
      league(boca, banfield, "2026-11-22T21:00:00Z"),
      league(instituto, huracan, "2026-11-22T19:00:00Z"),
      league(godoy, tristan, "2026-11-24T21:00:00Z"),
      knockout("copa-argentina", "Final", boca, huracan, [0, 0], 0, {
        status: "scheduled",
        kickoff: new Date("2026-11-18T23:00:00Z"),
      }),
    ]);
    expect(upcoming.days.map((d) => d.day)).toEqual([
      "miércoles 18 de noviembre",
      "domingo 22 de noviembre",
    ]);
    expect(upcoming.days[0].groups[0].label).toBe("Copa Argentina, final");
    const sunday = upcoming.days[1].groups[0];
    expect(sunday.label).toBe("Clausura, octavos de final");
    expect(sunday.matches.map((m) => [m.home.name, m.time])).toEqual([
      ["Instituto", "16:00"],
      ["Boca Juniors", "18:00"],
    ]);
    expect(upcoming.more).toEqual([]);
  });

  it("groups matches without a confirmed kickoff after the dated days", () => {
    const placeholder = "2026-11-22T21:00:00Z";
    const { upcoming } = build([
      league(boca, banfield, placeholder),
      league(instituto, huracan, placeholder),
      league(godoy, tristan, placeholder),
      league(banfield, boca, placeholder),
      knockout("copa-argentina", "Final", boca, huracan, [0, 0], 0, {
        status: "scheduled",
        kickoff: new Date("2026-11-21T23:00:00Z"),
      }),
    ]);
    expect(upcoming.days.map((d) => d.day)).toEqual([
      "sábado 21 de noviembre",
      "Fecha a confirmar",
    ]);
    const [group] = upcoming.days[1].groups;
    expect(group.label).toBe("Clausura, octavos de final");
    expect(group.matches.map((m) => [m.home.name, m.time, m.unconfirmed])).toEqual([
      ["Boca Juniors", "", true],
      ["Instituto", "", true],
      ["Godoy Cruz", "", true],
      ["Banfield", "", true],
    ]);

    const three = build([
      league(boca, banfield, placeholder),
      league(instituto, huracan, placeholder),
      league(godoy, tristan, placeholder),
    ]);
    expect(three.upcoming.days.map((d) => d.day)).toEqual(["domingo 22 de noviembre"]);
  });

  it("lists the last four days' results, latest day first", () => {
    const { results } = build([
      knockout("primera-nacional", "Super Final", godoy, tristan, [3, 1], 1),
      knockout("copa-argentina", "Semi-finals", banfield, boca, [0, 3], 2),
      knockout("copa-argentina", "Semi-finals", instituto, huracan, [1, 0], 5),
      knockout("primera-nacional", "Round of 16", huracan, banfield, [0, 1], 1, {
        status: "postponed",
      }),
    ]);
    expect(results.days.map((d) => d.day)).toEqual([
      "domingo 15 de noviembre",
      "sábado 14 de noviembre",
    ]);
    expect(results.days[0].groups.map((g) => g.label)).toEqual([
      "Primera Nacional, final",
      "Primera Nacional, octavos de final",
    ]);
    expect(results.days[0].groups[1].matches[0].status).toBe("postponed");
  });

  it("keeps a match that kicked off before the data caught up, without a score", () => {
    const { upcoming, results } = build([
      league(boca, banfield, "2026-11-16T14:40:00Z", { homeGoals: 0, awayGoals: 0 }),
    ]);
    expect(upcoming.days).toEqual([]);
    const [row] = results.days[0].groups[0].matches;
    expect([row.home.name, row.status, row.homeGoals, row.time]).toEqual([
      "Boca Juniors",
      "scheduled",
      null,
      "11:40",
    ]);
  });

  it("shows ten matches a side and links to the competitions of the rest", () => {
    const many = Array.from({ length: 13 }, (_, i) =>
      league(boca, banfield, `2026-11-${17 + Math.floor(i / 4)}T2${i % 4}:00:00Z`, {
        competition: i < 11 ? "liga-profesional" : "primera-nacional",
        tournament: i < 11 ? "clausura" : null,
      }),
    );
    const { upcoming } = build(many);
    expect(upcoming.days.flatMap((d) => d.groups.flatMap((g) => g.matches))).toHaveLength(10);
    expect(upcoming.more).toEqual([
      { href: "/liga-profesional", name: "Liga Profesional", count: 1 },
      { href: "/primera-nacional", name: "Primera Nacional", count: 2 },
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { buildCup, type CupData, type CupMatch } from "./cup";

const teams = [
  { id: 370969, name: "River Plate", slug: "river-plate", logoUrl: null },
  { id: 384585, name: "Boca Juniors", slug: "boca-juniors", logoUrl: null },
  { id: 371820, name: "Racing", slug: "racing", logoUrl: null },
  { id: 407562, name: "Instituto", slug: "instituto", logoUrl: null },
];

let nextId = 1;
function tie(
  roundLabel: string,
  home: number,
  away: number,
  score: [number, number] | null,
  day: number,
  pens: [number, number] | null = null,
): CupMatch {
  return {
    id: nextId++,
    roundLabel,
    status: score ? "finished" : "scheduled",
    kickoff: new Date(Date.UTC(2026, 10, day, 21)),
    homeTeamId: home,
    awayTeamId: away,
    homeGoals: score?.[0] ?? null,
    awayGoals: score?.[1] ?? null,
    homePenalties: pens?.[0] ?? null,
    awayPenalties: pens?.[1] ?? null,
  };
}

const data = (matches: CupMatch[]): CupData => ({ teams, matches });
const now = new Date("2026-11-16T12:00:00Z");
const build = (d: CupData) => buildCup(d, now);

describe("buildCup", () => {
  it("is empty until a tie has been played", () => {
    expect(build(data([tie("Semi-finals", 370969, 384585, null, 20)]))).toBeNull();
  });

  it("orders rounds by their first kickoff and ties by kickoff", () => {
    const { rounds } = build(
      data([
        tie("Semi-finals", 370969, 384585, [1, 0], 20),
        tie("Quarter-finals", 371820, 407562, [2, 1], 10),
        tie("Quarter-finals", 384585, 407562, [0, 1], 5),
      ]),
    )!;
    expect(rounds.map((r) => r.title)).toEqual(["Cuartos de final", "Semifinales"]);
    expect(rounds[0].ties.map((t) => t.home.name)).toEqual(["Boca Juniors", "Racing"]);
  });

  it("finds the winner, by penalties when the score is level", () => {
    const { rounds } = build(
      data([
        tie("Semi-finals", 370969, 384585, [1, 0], 20),
        tie("Semi-finals", 371820, 407562, [1, 1], 21, [3, 4]),
      ]),
    )!;
    expect(rounds[0].ties.map((t) => t.winner)).toEqual(["home", "away"]);
  });

  it("has no winner for a tie that is still to be played", () => {
    const { rounds } = build(
      data([
        tie("Quarter-finals", 370969, 384585, [1, 0], 10),
        tie("Semi-finals", 370969, 371820, null, 20),
      ]),
    )!;
    expect(rounds[1].ties[0].winner).toBeNull();
  });

  it("opens the latest round that has been played", () => {
    const { open } = build(
      data([
        tie("Quarter-finals", 370969, 384585, [1, 0], 10),
        tie("Semi-finals", 370969, 371820, null, 20),
      ]),
    )!;
    expect(open).toBe("quarter-finals");
  });

  it("paints the page with the team that most recently went through", () => {
    const { hero } = build(
      data([
        tie("Semi-finals", 370969, 384585, [2, 1], 20),
        tie("Semi-finals", 371820, 407562, [0, 1], 21),
      ]),
    )!;
    expect(hero.subject.name).toBe("Instituto");
    expect(hero.title).toBe("Instituto");
    expect(hero.summary).toBe(
      "Le ganó a Racing 1-0 en las semifinales. Ya está en la final; todavía no tiene fecha.",
    );
  });

  it("says who comes next when the following tie is scheduled", () => {
    const { hero } = build(
      data([
        tie("Quarter-finals", 370969, 384585, [2, 1], 10),
        tie("Semi-finals", 370969, 371820, null, 20),
      ]),
    )!;
    expect(hero.summary).toBe(
      "Le ganó a Boca Juniors 2-1 en los cuartos de final. El viernes 20 de noviembre enfrenta a Racing por las semifinales.",
    );
  });

  it("gives no date for a next tie whose kickoff is the round's placeholder", () => {
    const won = tie("Round of 16", 370969, 384585, [2, 1], 10);
    const quarters = [
      tie("Quarter-finals", 370969, 371820, null, 20),
      tie("Quarter-finals", 384585, 407562, null, 20),
      tie("Quarter-finals", 371820, 407562, null, 20),
      tie("Quarter-finals", 407562, 384585, null, 20),
    ];
    const { hero, rounds } = build(data([won, ...quarters]))!;
    expect(hero.summary).toBe(
      "Le ganó a Boca Juniors 2-1 en los octavos de final. Enfrenta a Racing por los cuartos de final; todavía no tiene fecha confirmada.",
    );
    expect(rounds[1].day).toBe("Días y horarios a confirmar");
    expect(rounds[1].ties.every((t) => t.unconfirmed)).toBe(true);
    expect(build(data([won, ...quarters.slice(0, 3)]))!.hero.summary).toMatch(
      /El viernes 20 de noviembre enfrenta a Racing/,
    );
  });

  it("tells a shoot-out from a win in regulation", () => {
    const { hero } = build(data([tie("Round of 16", 370969, 384585, [1, 1], 10, [2, 4])]))!;
    expect(hero.subject.name).toBe("Boca Juniors");
    expect(hero.summary).toBe(
      "Empató 1-1 con River Plate en los octavos de final y ganó 4-2 por penales. Ya está en los cuartos de final; todavía no tiene fecha.",
    );
  });

  it("says when the final is being played or was postponed", () => {
    const semi = tie("Semi-finals", 370969, 384585, [2, 1], 10);
    const final = { ...tie("Final", 371820, 370969, null, 16), kickoff: now };
    expect(build(data([semi, { ...final, status: "live" }]))!.hero.summary).toBe(
      "Le ganó a Boca Juniors 2-1 en las semifinales. Está jugando la final contra Racing.",
    );
    expect(build(data([semi, { ...final, status: "postponed" }]))!.hero.summary).toBe(
      "Le ganó a Boca Juniors 2-1 en las semifinales. La final contra Racing está postergada.",
    );
  });

  it("says nothing about the next stage after a round it doesn't know", () => {
    const { hero } = build(data([tie("Preliminary Round", 370969, 384585, [2, 1], 10)]))!;
    expect(hero.summary).toBe("Le ganó a Boca Juniors 2-1 en Preliminary Round.");
  });

  it("has no winner for a shoot-out with level penalties", () => {
    const { rounds } = build(
      data([
        tie("Semi-finals", 370969, 384585, [1, 1], 10, [4, 4]),
        tie("Semi-finals", 371820, 407562, [1, 0], 11),
      ]),
    )!;
    expect(rounds[0].ties.map((t) => t.winner)).toEqual([null, "home"]);
  });

  it("calls the winner of the final the champion", () => {
    const { hero } = build(data([tie("Final", 370969, 384585, [3, 0], 20)]))!;
    expect(hero.summary).toBe(
      "Le ganó a Boca Juniors 3-0 en la final. Es el campeón de la Copa Argentina.",
    );
  });
});

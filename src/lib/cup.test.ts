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

describe("buildCup", () => {
  it("is empty until a tie has been played", () => {
    expect(buildCup(data([tie("Semi-finals", 370969, 384585, null, 20)]))).toBeNull();
  });

  it("orders rounds by their first kickoff and ties by kickoff", () => {
    const { rounds } = buildCup(
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
    const { rounds } = buildCup(
      data([
        tie("Semi-finals", 370969, 384585, [1, 0], 20),
        tie("Semi-finals", 371820, 407562, [1, 1], 21, [3, 4]),
      ]),
    )!;
    expect(rounds[0].ties.map((t) => t.winner)).toEqual(["home", "away"]);
  });

  it("has no winner for a tie that is still to be played", () => {
    const { rounds } = buildCup(
      data([
        tie("Quarter-finals", 370969, 384585, [1, 0], 10),
        tie("Semi-finals", 370969, 371820, null, 20),
      ]),
    )!;
    expect(rounds[1].ties[0].winner).toBeNull();
  });

  it("opens the latest round that has been played", () => {
    const { open } = buildCup(
      data([
        tie("Quarter-finals", 370969, 384585, [1, 0], 10),
        tie("Semi-finals", 370969, 371820, null, 20),
      ]),
    )!;
    expect(open).toBe("quarter-finals");
  });

  it("paints the page with the team that most recently went through", () => {
    const { hero } = buildCup(
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
    const { hero } = buildCup(
      data([
        tie("Quarter-finals", 370969, 384585, [2, 1], 10),
        tie("Semi-finals", 370969, 371820, null, 20),
      ]),
    )!;
    expect(hero.summary).toBe(
      "Le ganó a Boca Juniors 2-1 en los cuartos de final. El viernes 20 de noviembre enfrenta a Racing por las semifinales.",
    );
  });

  it("tells a shoot-out from a win in regulation", () => {
    const { hero } = buildCup(data([tie("Round of 16", 370969, 384585, [1, 1], 10, [2, 4])]))!;
    expect(hero.subject.name).toBe("Boca Juniors");
    expect(hero.summary).toBe(
      "Empató 1-1 con River Plate en los octavos de final y ganó 4-2 por penales. Ya está en los cuartos de final; todavía no tiene fecha.",
    );
  });

  it("calls the winner of the final the champion", () => {
    const { hero } = buildCup(data([tie("Final", 370969, 384585, [3, 0], 20)]))!;
    expect(hero.summary).toBe(
      "Le ganó a Boca Juniors 3-0 en la final. Es el campeón de la Copa Argentina.",
    );
  });
});

import { expect, test } from "vitest";
import { unconfirmedKickoff } from "./results";

const sunday = new Date("2026-11-22T21:00:00Z");
const slot = (extra: Partial<Parameters<ReturnType<typeof unconfirmedKickoff>>[0]> = {}) => ({
  competition: "liga-profesional" as const,
  roundLabel: "Round of 16",
  status: "scheduled" as const,
  kickoff: sunday,
  ...extra,
});

test("takes four or more unplayed matches of a round at one instant as a placeholder", () => {
  const round = [slot(), slot(), slot(), slot()];
  const tbd = unconfirmedKickoff(round);
  expect(round.map(tbd)).toEqual([true, true, true, true]);
});

test("keeps three simultaneous matches, or matches at different times, as dated", () => {
  const three = [slot(), slot(), slot()];
  expect(three.map(unconfirmedKickoff(three))).toEqual([false, false, false]);
  const spread = [0, 1, 2, 3].map((h) => slot({ kickoff: new Date(sunday.getTime() + h * 3.6e6) }));
  expect(spread.some(unconfirmedKickoff(spread))).toBe(false);
});

test("counts only unplayed matches of the same competition and round", () => {
  const mixed = [
    slot(),
    slot(),
    slot(),
    slot({ status: "finished" }),
    slot({ competition: "primera-nacional" }),
    slot({ roundLabel: "Quarter-finals" }),
  ];
  expect(mixed.some(unconfirmedKickoff(mixed))).toBe(false);
  const round = [slot(), slot(), slot(), slot(), slot({ status: "finished" })];
  expect(round.map(unconfirmedKickoff(round))).toEqual([true, true, true, true, false]);
});

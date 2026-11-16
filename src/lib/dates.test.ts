import { expect, test } from "vitest";
import { dayLabel, rangeLabel, timeLabel } from "./dates";

const at = (iso: string) => new Date(iso);

test("formats in Buenos Aires time", () => {
  expect(dayLabel(at("2026-11-23T01:30:00Z"))).toBe("domingo 22 de noviembre");
  expect(timeLabel(at("2026-11-22T21:00:00Z"))).toBe("18:00");
});

test("labels a round by its day or its span", () => {
  expect(rangeLabel(at("2026-11-22T18:00:00Z"), at("2026-11-22T23:00:00Z"))).toBe(
    "domingo 22 de noviembre",
  );
  expect(rangeLabel(at("2026-11-05T22:00:00Z"), at("2026-11-08T22:30:00Z"))).toBe(
    "del 5 al 8 de noviembre",
  );
  expect(rangeLabel(at("2026-10-30T22:00:00Z"), at("2026-11-02T22:00:00Z"))).toBe(
    "del 30 de octubre al 2 de noviembre",
  );
});

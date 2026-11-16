import { expect, test } from "vitest";
import { paint } from "./paint";

test("uses the first colour and white text on dark colours", () => {
  expect(paint(407562)).toEqual({ lead: "#d2232a", onLead: "#ffffff" }); // Instituto
});

test("skips white as the lead colour", () => {
  expect(paint(370969)).toEqual({ lead: "#e30613", onLead: "#ffffff" }); // River Plate
});

test("puts black text on light colours", () => {
  expect(paint(376926)).toEqual({ lead: "#f5d000", onLead: "#000000" }); // Defensa y Justicia
  expect(paint(371820).onLead).toBe("#000000"); // Racing
});

test("falls back to black for teams without colours", () => {
  expect(paint(1)).toEqual({ lead: "#000000", onLead: "#ffffff" });
});

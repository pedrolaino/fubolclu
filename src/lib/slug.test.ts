import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it.each([
    ["Vélez Sarsfield", "velez-sarsfield"],
    ["Gimnasia M.", "gimnasia-m"],
    ["Central Cordoba de Santiago", "central-cordoba-de-santiago"],
  ])("%s -> %s", (name, slug) => {
    expect(slugify(name)).toBe(slug);
  });
});

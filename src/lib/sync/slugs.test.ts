import { describe, expect, it } from "vitest";
import { teamSlugs } from "./slugs";

const stored = [
  { id: 1, name: "Estudiantes", slug: "estudiantes" },
  { id: 2, name: "Talleres", slug: "talleres" },
];

describe("teamSlugs", () => {
  it("slugs new teams from their name", () => {
    expect(teamSlugs([{ id: 3, name: "Boca Juniors" }], stored)).toEqual(
      new Map([[3, "boca-juniors"]]),
    );
  });

  it("adds the id when another team holds the slug", () => {
    expect(teamSlugs([{ id: 4, name: "Estudiantes" }], stored).get(4)).toBe("estudiantes-4");
  });

  it("adds the id when an earlier team in the batch took the slug", () => {
    const batch = [
      { id: 5, name: "Sarmiento" },
      { id: 6, name: "Sarmiento" },
    ];
    expect(teamSlugs(batch, stored)).toEqual(
      new Map([
        [5, "sarmiento"],
        [6, "sarmiento-6"],
      ]),
    );
  });

  it("keeps a team's slug while its name stays the same", () => {
    const withSuffix = [...stored, { id: 4, name: "Estudiantes", slug: "estudiantes-4" }];
    // Even if the plain slug has been freed since.
    const batch = [
      { id: 1, name: "Estudiantes (LP)" },
      { id: 4, name: "Estudiantes" },
    ];
    expect(teamSlugs(batch, withSuffix)).toEqual(
      new Map([
        [1, "estudiantes-lp"],
        [4, "estudiantes-4"],
      ]),
    );
  });

  it("re-slugs a renamed team", () => {
    expect(teamSlugs([{ id: 2, name: "Talleres (C)" }], stored).get(2)).toBe("talleres-c");
  });
});

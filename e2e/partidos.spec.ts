import { expect, test } from "@playwright/test";

// Match ids come from the local database: one with details loaded, one without, one not played yet.
test("a match with details shows its timeline and statistics", async ({ page }) => {
  await page.goto("/partidos/1270743769");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("2-1");
  await expect(page.getByRole("heading", { name: "Cómo fue" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Estadísticas" })).toBeVisible();
  await expect(page.getByText("Posesión")).toBeVisible();
});

test("a played match without details says so", async ({ page }) => {
  await page.goto("/partidos/1270689305");
  await expect(page.getByText("Todavía no cargamos el detalle de este partido.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cómo fue" })).toHaveCount(0);
});

test("a scheduled match shows its kickoff time", async ({ page }) => {
  await page.goto("/partidos/1403785705");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^\d\d:\d\d$/);
  await expect(page.getByRole("heading", { name: "Estadísticas" })).toHaveCount(0);
});

test("the teams link to their pages", async ({ page }) => {
  await page.goto("/partidos/1270743769");
  await page.getByRole("main").getByRole("link").first().click();
  await expect(page).toHaveURL(/\/equipos\//);
});

test("an unknown match is a 404", async ({ page }) => {
  for (const id of ["123", "abc"]) {
    await page.goto(`/partidos/${id}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Página no encontrada");
  }
});

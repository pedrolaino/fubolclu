import { expect, test } from "@playwright/test";

test("a table row leads to the team page, painted for that team", async ({ page }) => {
  await page.goto("/liga-profesional");
  const link = page.getByRole("row").nth(1).getByRole("link");
  const name = (await link.innerText()).trim();
  await link.click();
  await expect(page).toHaveURL(/\/equipos\//);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.getByRole("heading", { name: "Posición por fecha" })).toBeVisible();
  await expect(page.getByRole("img", { name: /^Posición en cada fecha/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Goleadores" })).toBeVisible();
});

test("results link to their match", async ({ page }) => {
  await page.goto("/equipos/instituto");
  await page
    .getByRole("heading", { name: "Resultados" })
    .locator("..")
    .getByRole("link")
    .first()
    .click();
  await expect(page).toHaveURL(/\/partidos\/\d+$/);
});

test("a team that only plays the cup has fixtures but no table", async ({ page }) => {
  await page.goto("/equipos/atenas");
  await expect(page.getByRole("heading", { name: "Resultados" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Posición por fecha" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Goleadores" })).toHaveCount(0);
});

test("an unknown team is a 404", async ({ page }) => {
  // The status is only 404 once the page is cached; the first render has already sent its shell.
  await page.goto("/equipos/no-existe");
  await expect(page.getByText("This page could not be found.")).toBeVisible();
});

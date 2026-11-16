import { expect, test } from "@playwright/test";

test("the front page leads with this week's news and shows every competition", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).not.toBeEmpty();
  for (const name of [
    "Lo que viene",
    "Lo último",
    "Liga Profesional",
    "Goleadores",
    "Cómo viene el año",
    "Campeón de Liga",
    "Primera Nacional",
    "Copa Argentina",
  ]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "Zona A", exact: true })).toHaveAttribute(
    "href",
    "/liga-profesional#zona-a",
  );
});

test("a match on the front page links to its page", async ({ page }) => {
  await page.goto("/");
  const match = page.getByRole("main").locator('a[href^="/partidos/"]').first();
  await match.click();
  await expect(page).toHaveURL(/\/partidos\/\d+$/);
});

test("every page says when the data was updated and where it comes from", async ({ page }) => {
  await page.goto("/liga-profesional");
  const footer = page.getByRole("contentinfo");
  await expect(footer).toContainText(/Datos actualizados el \w+ \d+ de \w+ a las \d\d:\d\d/);
  await expect(footer.getByRole("link", { name: "Datos de Highlightly" })).toHaveAttribute(
    "href",
    "https://highlightly.net",
  );
});

test("an unknown address is a 404 with the way back", async ({ page }) => {
  const response = await page.goto("/no-existe");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Página no encontrada");
  await page.getByRole("main").getByRole("link", { name: "Copa Argentina" }).click();
  await expect(page).toHaveURL(/\/copa-argentina$/);
});

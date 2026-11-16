import { expect, test } from "@playwright/test";

test("shows the seats and highlights the ones of a picked team", async ({ page }) => {
  await page.goto("/como-se-define");
  await expect(page.getByRole("heading", { name: "Campeón del Apertura" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Desciende por el promedio" })).toBeVisible();

  const status = page.getByRole("status");
  await expect(status).toContainText("Elegí un equipo");

  const leader = (
    await page
      .getByRole("heading", { level: 4, name: "Campeón de Liga" })
      .locator("xpath=../../..")
      .getByRole("link")
      .first()
      .innerText()
  ).trim();
  await page.getByLabel("Elegí un equipo").selectOption({ label: leader });
  await expect(status).toContainText(`${leader} es Campeón de Liga`);
});

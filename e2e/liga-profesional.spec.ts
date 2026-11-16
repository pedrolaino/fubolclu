import { expect, test } from "@playwright/test";

test("switching tables changes the team in charge of the page", async ({ page }) => {
  await page.goto("/liga-profesional");
  const leader = page.getByRole("row").nth(1).getByRole("link");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    (await leader.innerText()).trim(),
  );

  await page.getByRole("tab", { name: "Promedios" }).click();
  await expect(page).toHaveURL(/#promedios$/);
  await expect(page.getByRole("columnheader", { name: "Promedio" })).toBeVisible();
  const last = page.getByRole("row").last().getByRole("link");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText((await last.innerText()).trim());
});

test("a table can be linked to directly", async ({ page }) => {
  await page.goto("/liga-profesional#anual");
  await expect(page.getByRole("tab", { name: "Anual" })).toHaveAttribute("aria-selected", "true");
});

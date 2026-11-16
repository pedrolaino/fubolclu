import { expect, test } from "@playwright/test";

test("has a table per zone and the scorers, with the lines of the format", async ({ page }) => {
  await page.goto("/primera-nacional");
  // The scorers tab only appears once match details have been synced.
  await expect(page.getByRole("tab").first()).toHaveText("Zona A");
  await expect(page.getByRole("tab").nth(1)).toHaveText("Zona B");
  await expect(page.getByText("descienden")).toBeVisible();
  // 18 teams and the header row.
  await expect(page.getByRole("row")).toHaveCount(19);
});

test("the second zone is led by its own team", async ({ page }) => {
  await page.goto("/primera-nacional#zona-b");
  const leader = page.getByRole("row").nth(1).getByRole("link");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    (await leader.innerText()).trim(),
  );
});

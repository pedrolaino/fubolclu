import { expect, test } from "@playwright/test";

test("every round is a column on a wide screen", async ({ page, isMobile }) => {
  test.skip(isMobile, "phones show one round at a time");
  await page.goto("/copa-argentina");
  await expect(page.getByRole("heading", { level: 1 })).not.toBeEmpty();
  await expect(page.getByRole("heading", { name: "Semifinales" })).toBeVisible();
});

test("on a phone one round is shown and the tabs switch it", async ({ page, isMobile }) => {
  test.skip(!isMobile, "tabs are only shown on narrow screens");
  await page.goto("/copa-argentina");
  await expect(page.getByRole("tab", { name: "Semifinales" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(2);
  await page.getByRole("tab", { name: "32avos de final" }).click();
  await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(32);
});

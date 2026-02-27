import { test, expect, devices } from "@playwright/test";

test.describe("Responsive design", () => {
  test("login page renders on mobile", async ({ browser }) => {
    const context = await browser.newContext({
      ...devices["iPhone 14"],
    });
    const page = await context.newPage();
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /connexion/i })).toBeVisible();
    await context.close();
  });

  test("login page renders on desktop", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /connexion/i })).toBeVisible();
    await context.close();
  });
});

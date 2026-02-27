import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should redirect root to login when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(login|dashboard)/);
  });

  test("should have proper page titles", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Poker Tracker/);
  });

  test("should show PWA manifest link", async ({ page }) => {
    await page.goto("/login");
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute("href", "/manifest.json");
  });
});

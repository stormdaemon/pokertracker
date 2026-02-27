import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should show login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /connexion/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /se connecter/i })).toBeVisible();
  });

  test("should show registration form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /inscription/i })).toBeVisible();
    await expect(page.getByLabel(/pseudo/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test("should navigate between login and register", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /créer un compte/i }).click();
    await expect(page).toHaveURL(/\/register/);
    await page.getByRole("link", { name: /se connecter/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("should show forgot password page", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /mot de passe oublié/i })).toBeVisible();
  });

  test("should validate email format on login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("not-an-email");
    await page.getByLabel(/mot de passe/i).fill("password123");
    await page.getByRole("button", { name: /se connecter/i }).click();
    // Form should show validation error (browser native or custom)
    await expect(page.getByLabel(/email/i)).toBeFocused();
  });
});

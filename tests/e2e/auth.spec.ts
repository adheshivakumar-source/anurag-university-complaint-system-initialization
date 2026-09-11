// tests/e2e/auth.spec.ts
// ============================================================
// E2E Test Suite: Authentication
// Tests the fundamental auth protection behavior of AU-CTS.
//
// These are REAL tests — they verify actual redirects happen,
// not just that pages load.
// ============================================================

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("Authentication — Route Protection", () => {
  test.beforeEach(async ({ page }) => {
    // Clear all cookies/storage between tests to ensure clean state
    await page.context().clearCookies();
  });

  test("unauthenticated user visiting /dashboard is redirected to /login", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/);

    // Login page should be visible
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
  });

  test("unauthenticated user visiting /complaints is redirected to /login", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/complaints`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user visiting /admin is redirected to /login", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/admin`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page preserves redirect destination in URL", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // The redirectTo param should be preserved
    const url = new URL(page.url());
    expect(url.searchParams.get("redirectTo")).toBe("/dashboard");
  });

  test("login page is publicly accessible without redirect", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`);

    // Should stay on login page — no redirect loop
    await expect(page).toHaveURL(/\/login/);

    // Form elements should be present
    await expect(page.getByLabel(/institutional email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in/i }),
    ).toBeVisible();
  });

  test("login page shows Anurag University branding", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Check for institutional identity elements visible across desktop and mobile
    await expect(
      page.getByText(/authorized Anurag University personnel/i),
    ).toBeVisible();
  });

  test("login form shows validation errors for empty submission", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`);

    // Submit empty form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Validation errors should appear
    await expect(
      page.getByText(/email address is required/i),
    ).toBeVisible();
    await expect(
      page.getByText(/password is required/i),
    ).toBeVisible();
  });

  test("login form shows validation error for invalid email", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`);

    await page.getByLabel(/institutional email/i).fill("not-an-email");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(
      page.getByText(/valid email address/i),
    ).toBeVisible();
  });
});

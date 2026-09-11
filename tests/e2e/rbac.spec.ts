// tests/e2e/rbac.spec.ts
// ============================================================
// E2E Test Suite: Role-Based Access Control (RBAC) & Route Security
// ============================================================

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("RBAC & Protected Boundary Enforcement", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("unauthenticated attempts to access /admin/users are redirected to /login", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/admin/users`);
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("redirectTo")).toBe("/admin/users");
  });

  test("unauthenticated attempts to access /officer are redirected to /login", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/officer`);
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("redirectTo")).toBe("/officer");
  });

  test("unauthenticated attempts to access /profile are redirected to /login", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/profile`);
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("redirectTo")).toBe("/profile");
  });

  test("login page displays error message when unauthorized error code is passed", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login?error=unauthorized`);
    await expect(
      page.getByText(/do not have administrative clearance/i),
    ).toBeVisible();
  });

  test("login page displays error message when deactivated error code is passed", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login?error=deactivated`);
    await expect(
      page.getByText(/account has been deactivated/i),
    ).toBeVisible();
  });
});

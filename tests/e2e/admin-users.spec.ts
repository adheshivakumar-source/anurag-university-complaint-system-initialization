// tests/e2e/admin-users.spec.ts
// ============================================================
// E2E Test Suite: Admin User Management Directory Interface
// ============================================================

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("Admin User Management Interface Security", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("direct unauthenticated GET to /admin/users redirects to /login", async ({
    page,
  }) => {
    const response = await page.goto(`${BASE_URL}/admin/users`);
    expect(response?.url()).toContain("/login");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin%2Fusers/);
  });

  test("direct unauthenticated GET to /admin redirects to /login", async ({
    page,
  }) => {
    const response = await page.goto(`${BASE_URL}/admin`);
    expect(response?.url()).toContain("/login");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin/);
  });
});

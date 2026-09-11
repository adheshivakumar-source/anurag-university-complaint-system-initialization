// tests/e2e/auth.spec.ts
// ============================================================
// E2E Test Suite: Authentication & Registration (AU-CTS Phase 2)
// Verifies unauthenticated route protection, registration flow,
// and login form behavior.
// ============================================================

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("Authentication — Route Protection & Redirection", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("unauthenticated user visiting /dashboard is redirected to /login", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
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

  test("unauthenticated user visiting /officer is redirected to /login", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/officer`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user visiting /profile is redirected to /login", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/profile`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page preserves redirect destination in URL", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    const url = new URL(page.url());
    expect(url.searchParams.get("redirectTo")).toBe("/dashboard");
  });

  test("login page is publicly accessible without redirect loop", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByLabel(/institutional email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("login page shows Anurag University branding and registration link", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(
      page.getByText(/authorized Anurag University personnel/i),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /register an account/i }),
    ).toBeVisible();
  });

  test("login form shows validation errors on empty submission", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/email address is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test("login form validates email format", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/institutional email/i).fill("invalid-email-string");
    await page.getByLabel(/password/i).fill("ValidPass123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/valid email address/i)).toBeVisible();
  });
});

test.describe("Registration — Onboarding Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("registration page is publicly accessible and displays role choices", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/register`);
    await expect(page).toHaveURL(/\/register/);
    await expect(
      page.getByRole("heading", { name: /institutional registration/i }),
    ).toBeVisible();

    // Check Role select contains self-registration roles
    const roleSelect = page.locator("#role-select");
    await expect(roleSelect).toBeVisible();

    const options = await roleSelect.locator("option").allTextContents();
    expect(options).toContain("Student");
    expect(options).toContain("Faculty");
    expect(options).toContain("Administrative / Support Staff");
    // Ensure privileged roles cannot be self-registered
    expect(options).not.toContain("Administrator");
    expect(options).not.toContain("Department Officer");
  });

  test("registration form shows validation errors for empty fields", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/register`);
    await page
      .getByRole("button", { name: /register institutional account/i })
      .click();

    await expect(page.getByText(/full name must be at least/i)).toBeVisible();
    await expect(page.getByText(/email address is required/i)).toBeVisible();
    await expect(page.getByText(/password must be at least 8/i)).toBeVisible();
  });

  test("registration validates password matching", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.getByLabel(/full name/i).fill("Test Student");
    await page.getByLabel(/institutional email/i).fill("student@anurag.edu.in");
    await page.getByLabel(/^password/i).fill("Password123");
    await page.getByLabel(/confirm password/i).fill("DifferentPassword456");
    await page
      .getByRole("button", { name: /register institutional account/i })
      .click();

    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test("registration dynamically displays Student Roll ID field when Student role is selected", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.locator("#role-select").selectOption("student");
    await expect(
      page.getByLabel(/student roll \/ registration id/i),
    ).toBeVisible();

    await page.locator("#role-select").selectOption("faculty");
    await expect(page.getByLabel(/employee \/ staff id/i)).toBeVisible();
    await expect(
      page.getByLabel(/student roll \/ registration id/i),
    ).not.toBeVisible();
  });
});

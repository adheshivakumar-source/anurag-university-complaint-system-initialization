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

  test("login form rejects non-Anurag email domains", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/institutional email/i).fill("student@gmail.com");
    await page.getByLabel(/password/i).fill("ValidPass123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(
      page.getByText(/ending with @anurag\.edu\.in/i),
    ).toBeVisible();
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

  test("registration rejects non-Anurag email domains (gmail, outlook, yahoo)", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.getByLabel(/full name/i).fill("Test Student");
    await page.getByLabel(/institutional email/i).fill("student@gmail.com");
    await page.getByLabel(/^password/i).fill("Password123");
    await page.getByLabel(/confirm password/i).fill("Password123");
    await page
      .getByRole("button", { name: /register institutional account/i })
      .click();

    await expect(
      page.getByText(/ending with @anurag\.edu\.in/i),
    ).toBeVisible();
  });

  test("registration rejects domain attack strings and subdomains", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.getByLabel(/full name/i).fill("Test Student");
    await page
      .getByLabel(/institutional email/i)
      .fill("student@anurag.edu.in.attacker.com");
    await page.getByLabel(/^password/i).fill("Password123");
    await page.getByLabel(/confirm password/i).fill("Password123");
    await page
      .getByRole("button", { name: /register institutional account/i })
      .click();

    await expect(
      page.getByText(/ending with @anurag\.edu\.in/i),
    ).toBeVisible();
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

test.describe("AU-CTS Authentication Domain Invariants & Normalization", () => {
  const { isAnuragEmail, anuragEmailSchema } = require("../../src/shared/validation/validation");

  test("accepts valid standard Anurag University email addresses", () => {
    expect(isAnuragEmail("shivakumar@anurag.edu.in")).toBe(true);
    expect(isAnuragEmail("ruthiraj@anurag.edu.in")).toBe(true);
    expect(isAnuragEmail("21ag1a0501@anurag.edu.in")).toBe(true);
  });

  test("normalizes uppercase and mixed-case email addresses", () => {
    expect(isAnuragEmail("RUTHIRAJ@ANURAG.EDU.IN")).toBe(true);
    expect(isAnuragEmail("ShivaKumar@Anurag.Edu.In")).toBe(true);
  });

  test("normalizes leading and trailing whitespace", () => {
    expect(isAnuragEmail("  ruthiraj@anurag.edu.in  ")).toBe(true);
  });

  test("rejects external public email domains", () => {
    expect(isAnuragEmail("student@gmail.com")).toBe(false);
    expect(isAnuragEmail("student@outlook.com")).toBe(false);
    expect(isAnuragEmail("student@yahoo.com")).toBe(false);
    expect(isAnuragEmail("student@hotmail.com")).toBe(false);
  });

  test("rejects domain spoofing and suffix attack attempts", () => {
    expect(isAnuragEmail("student@anurag.edu.in.attacker.com")).toBe(false);
    expect(isAnuragEmail("student@fakeanurag.edu.in")).toBe(false);
    expect(isAnuragEmail("student@anurag.edu.in@evil.com")).toBe(false);
  });

  test("rejects subdomains of anurag.edu.in", () => {
    expect(isAnuragEmail("student@sub.anurag.edu.in")).toBe(false);
    expect(isAnuragEmail("foo@bar.anurag.edu.in")).toBe(false);
  });

  test("rejects missing or empty local part", () => {
    expect(isAnuragEmail("@anurag.edu.in")).toBe(false);
    expect(isAnuragEmail("")).toBe(false);
    expect(isAnuragEmail(null)).toBe(false);
    expect(isAnuragEmail(undefined)).toBe(false);
  });

  test("anuragEmailSchema parses valid input and returns normalized string", () => {
    const parsed = anuragEmailSchema.safeParse("  USER@ANURAG.EDU.IN  ");
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.trim().toLowerCase()).toBe("user@anurag.edu.in");
    }
  });

  test("anuragEmailSchema rejects invalid domain with institutional message", () => {
    const result = anuragEmailSchema.safeParse("user@gmail.com");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/ending with @anurag\.edu\.in/i);
    }
  });
});

test.describe("AU-CTS Authentication Error Mapping & Toast Feedback", () => {
  const { mapAuthError } = require("../../src/utils/auth-errors");

  test("maps invalid credential error to user-friendly message", () => {
    const res = mapAuthError("auth/invalid-credential");
    expect(res.message).toBe("The email or password is incorrect.");
  });

  test("maps wrong password error to user-friendly message", () => {
    const res = mapAuthError("auth/wrong-password");
    expect(res.message).toBe("The email or password is incorrect.");
  });

  test("maps user not found error to user-friendly message", () => {
    const res = mapAuthError("auth/user-not-found");
    expect(res.message).toBe("No account was found with this email.");
  });

  test("maps email already in use error to user-friendly message", () => {
    const res = mapAuthError("auth/email-already-in-use");
    expect(res.message).toBe("An account already exists with this email. Please sign in instead.");
  });

  test("maps weak password error to user-friendly message", () => {
    const res = mapAuthError("auth/weak-password");
    expect(res.message).toBe("Please choose a stronger password.");
  });

  test("maps too many requests error to user-friendly message", () => {
    const res = mapAuthError("auth/too-many-requests");
    expect(res.message).toBe("Too many attempts. Please wait a moment and try again.");
  });

  test("maps domain error with institutional title and message", () => {
    const res = mapAuthError("Only Anurag University (@anurag.edu.in) accounts are permitted.");
    expect(res.title).toBe("University email required");
    expect(res.message).toBe("Please use your @anurag.edu.in email address.");
  });

  test("safely maps null, undefined, or empty error to generic message", () => {
    expect(mapAuthError(null).message).toBe("Something went wrong. Please try again.");
    expect(mapAuthError(undefined).message).toBe("Something went wrong. Please try again.");
    expect(mapAuthError("").message).toBe("Something went wrong. Please try again.");
  });
});

test.describe("AU-CTS Auth Toast Notifications in UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("login form displays toast notification on domain rejection", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/institutional email/i).fill("outsider@gmail.com");
    await page.getByLabel(/password/i).fill("SecretPass123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Check toast popup renders
    const toast = page.locator("[data-testid='toast-item']");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/University email required/i);
    await expect(toast).toContainText(/@anurag\.edu\.in/i);
  });

  test("registration form displays toast notification on domain rejection", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.getByLabel(/full name/i).fill("Test Student");
    await page.getByLabel(/institutional email/i).fill("outsider@outlook.com");
    await page.getByLabel(/^password/i).fill("Password123");
    await page.getByLabel(/confirm password/i).fill("Password123");
    await page.getByRole("button", { name: /register institutional account/i }).click();

    const toast = page.locator("[data-testid='toast-item']");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/University email required/i);
    await expect(toast).toContainText(/@anurag\.edu\.in/i);
  });

  test("login form displays 'Account not registered' toast and registration action for unregistered anurag email", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`);
    await page
      .getByLabel(/institutional email/i)
      .fill("nonexistent_student_99999@anurag.edu.in");
    await page.getByLabel(/password/i).fill("SomePassword123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Check toast popup renders with "Account not registered" and action
    const toast = page.locator("[data-testid='toast-item']");
    await expect(toast).toBeVisible({ timeout: 10000 });
    await expect(toast).toContainText(/Account not registered/i);
    await expect(toast).toContainText(/We couldn't find an AU-CTS account/i);

    const toastAction = page.locator("[data-testid='toast-action-btn']");
    await expect(toastAction).toBeVisible();
    await expect(toastAction).toContainText(/Go to Registration/i);

    // Also verify inline error banner and link
    const inlineAlert = page.locator("form [role='alert']");
    await expect(inlineAlert).toBeVisible();
    await expect(inlineAlert).toContainText(
      /We couldn't find an AU-CTS account with this Anurag University email/i,
    );
    await expect(
      inlineAlert.getByRole("link", { name: /Go to Registration/i }),
    ).toBeVisible();
  });
});

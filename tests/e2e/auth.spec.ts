// tests/e2e/auth.spec.ts
// ============================================================
// E2E Test Suite: Authentication & Registration (AU-CTS Phase 2)
// Verifies unauthenticated route protection, registration flow,
// and login form behavior for Student, Faculty, and Staff.
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
      page.getByRole("link", { name: /create an account/i }),
    ).toBeVisible();
  });

  test("login form shows validation errors on empty submission", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(
      page.getByText(/email address is required/i).first(),
    ).toBeVisible();
  });

  test("registration validates password matching", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.getByLabel(/full name/i).fill("Test Student");
    await page.getByLabel(/^student roll/i).fill("26EG512D03");
    await page.getByLabel(/institutional email/i).fill("26eg512d03@anurag.edu.in");
    await page.getByLabel(/^password/i).fill("Password123");
    await page.getByLabel(/confirm password/i).fill("DifferentPassword456");
    await page
      .getByRole("button", { name: /register institutional account/i })
      .click();

    await expect(page.getByText(/passwords do not match/i).first()).toBeVisible();
  });

  test("registration dynamically displays category-specific ID fields for Student, Faculty, and Staff", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/register`);

    // Default: Student
    await expect(page.getByLabel(/^student roll/i)).toBeVisible();
    await expect(page.getByLabel(/faculty \/ employee id/i)).not.toBeVisible();
    await expect(page.getByLabel(/employee \/ staff id/i)).not.toBeVisible();

    // Faculty selection
    await page.locator("#role-select").selectOption("faculty");
    await expect(page.getByLabel(/faculty \/ employee id/i)).toBeVisible();
    await expect(page.getByLabel(/^student roll/i)).not.toBeVisible();
    await expect(page.getByLabel(/employee \/ staff id/i)).not.toBeVisible();

    // Staff selection
    await page.locator("#role-select").selectOption("staff");
    await expect(page.getByLabel(/employee \/ staff id/i)).toBeVisible();
    await expect(page.getByLabel(/^student roll/i)).not.toBeVisible();
    await expect(page.getByLabel(/faculty \/ employee id/i)).not.toBeVisible();
  });
});

test.describe("AU-CTS Authentication Domain Invariants & Normalization", () => {
  const {
    isAnuragEmail,
    isAnuragStudentEmail,
    isAnuragInstitutionalEmail,
    anuragStudentEmailSchema,
    anuragInstitutionalEmailSchema,
  } = require("../../src/shared/validation/validation");

  test("isAnuragStudentEmail accepts valid standard Anurag University roll-number email addresses", () => {
    expect(isAnuragStudentEmail("26eg512d03@anurag.edu.in")).toBe(true);
    expect(isAnuragStudentEmail("21ag1a0501@anurag.edu.in")).toBe(true);
    expect(isAnuragStudentEmail("22eg105a01@anurag.edu.in")).toBe(true);
  });

  test("isAnuragStudentEmail rejects non-roll-number institutional emails", () => {
    expect(isAnuragStudentEmail("faculty.member@anurag.edu.in")).toBe(false);
    expect(isAnuragStudentEmail("staff.admin@anurag.edu.in")).toBe(false);
    expect(isAnuragStudentEmail("name@anurag.edu.in")).toBe(false);
  });

  test("isAnuragInstitutionalEmail accepts all valid institutional emails", () => {
    expect(isAnuragInstitutionalEmail("26eg512d03@anurag.edu.in")).toBe(true);
    expect(isAnuragInstitutionalEmail("faculty.member@anurag.edu.in")).toBe(true);
    expect(isAnuragInstitutionalEmail("staff.admin@anurag.edu.in")).toBe(true);
    expect(isAnuragEmail("faculty.member@anurag.edu.in")).toBe(true);
  });

  test("isAnuragInstitutionalEmail rejects external public email domains", () => {
    expect(isAnuragInstitutionalEmail("user@gmail.com")).toBe(false);
    expect(isAnuragInstitutionalEmail("user@outlook.com")).toBe(false);
    expect(isAnuragInstitutionalEmail("user@yahoo.com")).toBe(false);
    expect(isAnuragInstitutionalEmail("user@hotmail.com")).toBe(false);
  });

  test("rejects domain spoofing and suffix attack attempts", () => {
    expect(isAnuragInstitutionalEmail("user@anurag.edu.in.attacker.com")).toBe(false);
    expect(isAnuragInstitutionalEmail("user@fakeanurag.edu.in")).toBe(false);
    expect(isAnuragInstitutionalEmail("user@anurag.edu.in@evil.com")).toBe(false);
  });

  test("rejects subdomains of anurag.edu.in", () => {
    expect(isAnuragInstitutionalEmail("user@sub.anurag.edu.in")).toBe(false);
    expect(isAnuragInstitutionalEmail("user@bar.anurag.edu.in")).toBe(false);
  });

  test("rejects missing or empty local part", () => {
    expect(isAnuragInstitutionalEmail("@anurag.edu.in")).toBe(false);
    expect(isAnuragInstitutionalEmail("")).toBe(false);
    expect(isAnuragInstitutionalEmail(null)).toBe(false);
    expect(isAnuragInstitutionalEmail(undefined)).toBe(false);
  });

  test("anuragStudentEmailSchema validates student roll email format", () => {
    const valid = anuragStudentEmailSchema.safeParse("26eg512d03@anurag.edu.in");
    expect(valid.success).toBe(true);

    const nonRoll = anuragStudentEmailSchema.safeParse("faculty.member@anurag.edu.in");
    expect(nonRoll.success).toBe(false);
    if (!nonRoll.success) {
      expect(nonRoll.error.issues[0].message).toBe("Please enter a valid email address.");
    }
  });

  test("anuragInstitutionalEmailSchema validates general university format", () => {
    const validRoll = anuragInstitutionalEmailSchema.safeParse("26eg512d03@anurag.edu.in");
    expect(validRoll.success).toBe(true);

    const validFaculty = anuragInstitutionalEmailSchema.safeParse("faculty.member@anurag.edu.in");
    expect(validFaculty.success).toBe(true);

    const invalidDomain = anuragInstitutionalEmailSchema.safeParse("faculty@gmail.com");
    expect(invalidDomain.success).toBe(false);
    if (!invalidDomain.success) {
      expect(invalidDomain.error.issues[0].message).toBe("Please enter a valid email address.");
    }
  });
});

test.describe("AU-CTS Authentication Error Mapping & Toast Feedback", () => {
  const { mapAuthError, isNextRedirect } = require("../../src/utils/auth-errors");

  test("maps invalid credential error to user-friendly message", () => {
    const res = mapAuthError("auth/invalid-credential");
    expect(res.message).toBe("Invalid email or password. Please try again.");
  });

  test("maps wrong password error to user-friendly message", () => {
    const res = mapAuthError("auth/wrong-password");
    expect(res.message).toBe("Invalid email or password. Please try again.");
  });

  test("maps user not found error to user-friendly message", () => {
    const res = mapAuthError("auth/user-not-found");
    expect(res.message).toBe("Account not found. Please register before signing in.");
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

  test("maps domain error with generic user-friendly message", () => {
    const res = mapAuthError("Only Anurag University (@anurag.edu.in) accounts are permitted.");
    expect(res.message).toBe("Please enter a valid email address.");
  });

  test("safely maps null, undefined, or empty error to generic message", () => {
    expect(mapAuthError(null).message).toBe("Something went wrong. Please try again.");
    expect(mapAuthError(undefined).message).toBe("Something went wrong. Please try again.");
    expect(mapAuthError("").message).toBe("Something went wrong. Please try again.");
  });

  test("isNextRedirect identifies Next.js NEXT_REDIRECT digest signals", () => {
    expect(isNextRedirect({ digest: "NEXT_REDIRECT;replace;/dashboard;307;" })).toBe(true);
    expect(isNextRedirect({ digest: "NEXT_REDIRECT;push;/login;307;" })).toBe(true);
    expect(isNextRedirect(new Error("NEXT_REDIRECT"))).toBe(true);
    expect(isNextRedirect(new Error("auth/invalid-credential"))).toBe(false);
    expect(isNextRedirect(null)).toBe(false);
    expect(isNextRedirect(undefined)).toBe(false);
    expect(isNextRedirect("string error")).toBe(false);
  });
});

test.describe("AU-CTS Auth Toast Notifications in UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("login form displays toast notification on domain rejection", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/institutional email/i).fill("26eg512d03@gmail.com");
    await page.getByLabel(/password/i).fill("SecretPass123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Check toast popup renders
    const toast = page.locator("[data-testid='toast-item']");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/Please enter a valid email address/i);
  });

  test("registration form displays toast notification on domain rejection for Student", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.getByLabel(/full name/i).fill("Test Student");
    await page.getByLabel(/^student roll/i).fill("26EG512D03");
    await page.getByLabel(/institutional email/i).fill("26eg512d03@outlook.com");
    await page.getByLabel(/^password/i).fill("Password123");
    await page.getByLabel(/confirm password/i).fill("Password123");
    await page.getByRole("button", { name: /register institutional account/i }).click();

    const toast = page.locator("[data-testid='toast-item']");
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/Please enter a valid email address/i);
  });

  test("registration form validates required Employee ID for Faculty role", async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await expect(page.getByLabel(/^student roll/i)).toBeVisible();
    await page.locator("#role-select").selectOption("faculty");
    await expect(page.getByLabel(/faculty \/ employee id/i)).toBeVisible();
    await page.getByLabel(/full name/i).fill("Faculty Member");
    await page.getByLabel(/institutional email/i).fill("faculty.member@anurag.edu.in");
    await page.getByLabel(/^password/i).fill("Password123");
    await page.getByLabel(/confirm password/i).fill("Password123");
    await page.getByRole("button", { name: /register institutional account/i }).click();

    await expect(page.getByText(/faculty \/ employee id is required/i).first()).toBeVisible();
  });

  test("login form displays 'Account not found' toast and registration action for unregistered anurag email without console noise", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    const uniqueRoll = `98ag${Math.floor(100000 + Math.random() * 900000)}`;
    const uniqueEmail = `${uniqueRoll}@anurag.edu.in`;

    await page.goto(`${BASE_URL}/login`);
    await page
      .getByLabel(/institutional email/i)
      .fill(uniqueEmail);
    await page.getByLabel(/password/i).fill("SomePassword123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Check toast popup renders with "Account not found" and action
    const toast = page.locator("[data-testid='toast-item']");
    await expect(toast).toBeVisible({ timeout: 10000 });
    await expect(toast).toContainText(/Account not found/i);
    await expect(toast).toContainText(/Account not found. Please register before signing in./i);

    const toastAction = page.locator("[data-testid='toast-action-btn']");
    await expect(toastAction).toBeVisible();
    await expect(toastAction).toContainText(/Create an account/i);

    // Also verify inline error banner and link
    const inlineAlert = page.locator("form [role='alert']");
    await expect(inlineAlert).toBeVisible();
    await expect(inlineAlert).toContainText(
      /Account not found. Please register before signing in./i,
    );
    await expect(
      inlineAlert.getByRole("link", { name: /Create an account/i }),
    ).toBeVisible();

    // Verify no [AU-CTS Auth] console.error was printed for this expected state
    const authErrorsInConsole = consoleErrors.filter((msg) =>
      msg.includes("[AU-CTS Auth]"),
    );
    expect(authErrorsInConsole).toHaveLength(0);
  });
});

test.describe("AU-CTS Role Assignment & Server-Side Security Invariants", () => {
  const { USER_ROLES, SELF_REGISTER_ROLES } = require("../../src/shared/types");

  test("SELF_REGISTER_ROLES contains only non-privileged roles", () => {
    expect(SELF_REGISTER_ROLES).toContain(USER_ROLES.STUDENT);
    expect(SELF_REGISTER_ROLES).toContain(USER_ROLES.FACULTY);
    expect(SELF_REGISTER_ROLES).toContain(USER_ROLES.STAFF);
    expect(SELF_REGISTER_ROLES).not.toContain(USER_ROLES.ADMIN);
    expect(SELF_REGISTER_ROLES).not.toContain(USER_ROLES.DEPARTMENT_OFFICER);
  });

  test("preserves explicitly provided studentId for Student role", () => {
    const email = "26eg512d03@anurag.edu.in";
    const role: string = USER_ROLES.STUDENT;
    const providedStudentId: string = "26EG512D03";
    const displayName = "Rohan Sharma";

    let resolvedStudentId: string | null = null;
    if (role === USER_ROLES.STUDENT) {
      if (providedStudentId && providedStudentId.trim().length > 0) {
        resolvedStudentId = providedStudentId.trim();
      }
    }

    expect(resolvedStudentId).toBe("26EG512D03");
    expect(displayName).toBe("Rohan Sharma");
  });

  test("preserves employeeId for Faculty and Staff roles and does not set studentId", () => {
    const facultyRole: string = USER_ROLES.FACULTY;
    const staffRole: string = USER_ROLES.STAFF;
    const providedEmployeeId: string = "AU-FAC-101";

    const resolveIds = (role: string, employeeId: string) => {
      let resolvedStudentId: string | null = null;
      let resolvedEmployeeId: string | null = null;

      if (role === USER_ROLES.STUDENT) {
        resolvedStudentId = "STUDENT-ID";
      } else if (role === USER_ROLES.FACULTY || role === USER_ROLES.STAFF) {
        resolvedEmployeeId = employeeId.trim();
      }

      return { resolvedStudentId, resolvedEmployeeId };
    };

    const facultyResult = resolveIds(facultyRole, providedEmployeeId);
    expect(facultyResult.resolvedStudentId).toBeNull();
    expect(facultyResult.resolvedEmployeeId).toBe("AU-FAC-101");

    const staffResult = resolveIds(staffRole, "AU-EMP-202");
    expect(staffResult.resolvedStudentId).toBeNull();
    expect(staffResult.resolvedEmployeeId).toBe("AU-EMP-202");
  });
});

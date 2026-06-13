import { test, expect } from "@playwright/test";
import { goto } from "./helpers";

test.describe("Routing", () => {
  test("unknown route renders the 404 page", async ({ page }) => {
    await goto(page, "/this/route/does/not/exist");
    await expect(
      page.getByRole("heading", { name: /404 .* Page not found/i }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Go home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  // BUG (documented): the app navigates to "/login" in 5 places
  // (logout, OTP flows, partner-login fallback) but no "/login" route exists —
  // only "/". So those navigations land on the 404 page. Remove `fixme` once a
  // "/login" route (or redirect to "/") is added.
  test("'/login' should show the login screen, not 404", async ({ page }) => {
    test.fixme(true, "No /login route defined — see E2E report.");
    await goto(page, "/login");
    await expect(
      page.getByRole("heading", { name: "Welcome Back!" }),
    ).toBeVisible();
  });

  // BUG (documented): protected layouts read the user from localStorage but
  // never redirect when it is absent, so anyone can open these dashboards
  // unauthenticated. These tests encode the EXPECTED secure behaviour; remove
  // `fixme` once an auth guard is added. See E2E report.
  const protectedRoutes = [
    "/customer/dashboard",
    "/vendor/dashboard",
    "/rider/dashboard",
    "/admin/dashboard",
  ];

  for (const route of protectedRoutes) {
    test(`unauthenticated access to ${route} redirects to login`, async ({
      page,
    }) => {
      test.fixme(true, "No auth guard on protected routes — see E2E report.");
      await goto(page, route);
      await expect(page).not.toHaveURL(new RegExp(`${route}$`));
    });
  }
});

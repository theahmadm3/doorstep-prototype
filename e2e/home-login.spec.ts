import { test, expect } from "@playwright/test";
import { goto, seedAuth } from "./helpers";

test.describe("Customer login (/)", () => {
  test("renders the login form", async ({ page }) => {
    await goto(page, "/");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue with phone" }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("08012345678")).toBeVisible();
  });

  test("validates the phone number (client-side)", async ({ page }) => {
    await goto(page, "/");

    const phone = page.getByPlaceholder("08012345678");
    await phone.fill("123");
    await phone.blur();

    await expect(
      page.getByText(/valid .*Nigerian phone number/i),
    ).toBeVisible();

    await phone.fill("08012345678");
    await expect(
      page.getByText(/valid .*Nigerian phone number/i),
    ).toHaveCount(0);
  });

  test("links to signup and partner login", async ({ page }) => {
    await goto(page, "/");

    await page.getByRole("link", { name: "Sign up" }).click();
    await expect(page).toHaveURL(/\/signup$/);

    await goto(page, "/");
    await page.getByRole("link", { name: "Partner login" }).click();
    await expect(page).toHaveURL(/\/partner-login$/);
  });

  test("redirects already-authenticated customer to dashboard", async ({
    page,
  }) => {
    await seedAuth(page, "customer");
    await goto(page, "/");
    await expect(page).toHaveURL(/\/customer\/dashboard$/);
  });

  test("redirects already-authenticated vendor to dashboard", async ({
    page,
  }) => {
    await seedAuth(page, "restaurant");
    await goto(page, "/");
    await expect(page).toHaveURL(/\/vendor\/dashboard$/);
  });

  test("redirects already-authenticated rider to dashboard", async ({
    page,
  }) => {
    await seedAuth(page, "driver");
    await goto(page, "/");
    await expect(page).toHaveURL(/\/rider\/dashboard$/);
  });
});

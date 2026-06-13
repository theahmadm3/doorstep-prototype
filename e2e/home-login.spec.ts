import { test, expect } from "@playwright/test";
import { goto, passWhatsappGate, seedAuth, SECRET_LOGIN_PATH } from "./helpers";

test.describe("Home / Customer login (/)", () => {
  test("renders the landing header and welcome card", async ({ page }) => {
    await goto(page, "/");
    await expect(
      page.getByRole("link", { name: "Doorstep" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome Back!" }),
    ).toBeVisible();
  });

  test("gates the login form behind WhatsApp onboarding", async ({ page }) => {
    await goto(page, "/");
    // Onboarding step is shown first.
    await expect(page.getByText("Join opposite-tank")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open WhatsApp" }),
    ).toBeVisible();
    // The phone form is NOT visible yet.
    await expect(page.getByLabel("Phone Number")).toHaveCount(0);

    await passWhatsappGate(page);

    // Now the login form is revealed.
    await expect(page.getByLabel("Phone Number")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send Login Code" }),
    ).toBeVisible();
  });

  test("validates the phone number (client-side)", async ({ page }) => {
    await goto(page, "/");
    await passWhatsappGate(page);

    const phone = page.getByLabel("Phone Number");
    await phone.fill("123");
    await phone.blur();

    await expect(
      page.getByText(/valid .*Nigerian phone number/i),
    ).toBeVisible();

    // Valid number clears the error.
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
    await page.getByRole("link", { name: "Login here" }).click();
    await expect(page).toHaveURL(new RegExp(`${SECRET_LOGIN_PATH}$`));
  });

  test("redirects already-authenticated customer to dashboard", async ({
    page,
  }) => {
    await seedAuth(page, "customer");
    await goto(page, "/");
    await expect(page).toHaveURL(/\/customer\/dashboard$/);
  });
});

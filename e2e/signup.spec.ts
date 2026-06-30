import { test, expect } from "@playwright/test";
import { goto, passWhatsappGate } from "./helpers";

test.describe("Customer signup (/signup)", () => {
  test("renders heading and gates the form behind onboarding", async ({
    page,
  }) => {
    await goto(page, "/signup");
    await expect(
      page.getByRole("heading", { name: "Create a Customer Account" }),
    ).toBeVisible();
    await expect(page.getByText("Join opposite-tank")).toBeVisible();
    await expect(page.getByLabel("Full Name")).toHaveCount(0);
  });

  test("reveals the signup form after onboarding", async ({ page }) => {
    await goto(page, "/signup");
    await passWhatsappGate(page);

    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Phone Number")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Create Account|Sign Up/i }),
    ).toBeVisible();
  });

  test("validates name and email (client-side)", async ({ page }) => {
    await goto(page, "/signup");
    await passWhatsappGate(page);

    await page.getByLabel("Full Name").fill("A");
    await page.getByLabel("Full Name").blur();
    await expect(page.getByText(/at least 2 characters/i)).toBeVisible();

    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Email").blur();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test("links back to login", async ({ page }) => {
    await goto(page, "/signup");
    await page.getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

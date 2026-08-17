import { test, expect } from "@playwright/test";
import { goto } from "./helpers";

test.describe("Customer signup (/signup)", () => {
  test("renders heading and shows the form directly", async ({ page }) => {
    await goto(page, "/signup");
    await expect(
      page.getByRole("heading", { name: "Create a Customer Account" }),
    ).toBeVisible();
    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Phone Number")).toBeVisible();
  });

  test("shows the submit button", async ({ page }) => {
    await goto(page, "/signup");

    await expect(
      page.getByRole("button", { name: /Create Account|Sign Up/i }),
    ).toBeVisible();
  });

  test("validates name and email (client-side)", async ({ page }) => {
    await goto(page, "/signup");

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

import { test, expect } from "@playwright/test";
import { goto, SECRET_LOGIN_PATH } from "./helpers";

test.describe("Partner login (secret route)", () => {
  test("renders the partner login form", async ({ page }) => {
    await goto(page, SECRET_LOGIN_PATH);
    await expect(
      page.getByRole("heading", { name: "Partner Login" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  });

  test("validates email format (client-side)", async ({ page }) => {
    await goto(page, SECRET_LOGIN_PATH);
    await page.getByLabel("Email").fill("bad-email");
    await page.getByLabel("Password").fill("secret");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test("'Back to Home' returns to /", async ({ page }) => {
    await goto(page, SECRET_LOGIN_PATH);
    await page.getByRole("link", { name: /Back to Home/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

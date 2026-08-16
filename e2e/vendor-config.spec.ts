import { test, expect } from "@playwright/test";
import { goto, seedAuth, mockApi, paginated } from "./helpers";
import { vendorProfile } from "./fixtures";

/**
 * Authenticated vendor menu configuration, fully mocked. Covers page
 * structure, section visibility, and the Add Category dialog trigger.
 */
test.describe("Vendor Config (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, "restaurant");
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      {
        method: "GET",
        path: "/restaurants/me/menu/categories/",
        json: paginated([]),
      },
      {
        method: "GET",
        path: "/restaurants/me/options/",
        json: paginated([]),
      },
      {
        method: "GET",
        path: "/restaurants/me/menu/",
        json: paginated([]),
      },
      {
        method: "GET",
        path: "/restaurants/me/drivers/",
        json: { drivers: [] },
      },
    ]);
  });

  test("renders the Menu Configuration and Rider Settings headings", async ({
    page,
  }) => {
    await goto(page, "/vendor/config");
    await expect(
      page.getByRole("heading", { name: "Menu Configuration" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Rider Settings" }),
    ).toBeVisible();
  });

  test("renders all four section cards", async ({ page }) => {
    await goto(page, "/vendor/config");
    await expect(
      page.getByRole("heading", { name: "Menu Categories" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Menu Options" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Your Menu Items" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Your Riders" }),
    ).toBeVisible();
  });

  test("Add Category button opens the dialog", async ({ page }) => {
    await goto(page, "/vendor/config");

    // The add button is inside the Menu Categories card.
    const addCategoryBtn = page
      .getByText("Menu Categories")
      .locator("..") // card header
      .locator("..")  // card
      .getByRole("button", { name: /Add/i })
      .first();

    await expect(addCategoryBtn).toBeVisible();
    await addCategoryBtn.click();

    await expect(
      page.getByRole("heading", { name: "Add a New Category" }),
    ).toBeVisible();
    await expect(page.getByLabel("Category Name")).toBeVisible();
  });
});

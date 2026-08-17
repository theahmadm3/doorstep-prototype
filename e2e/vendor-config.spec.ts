import { test, expect } from "@playwright/test";
import { goto, seedAuth, mockApi, paginated } from "./helpers";
import { vendorProfile } from "./fixtures";

/**
 * Authenticated vendor configuration, fully mocked. Covers tab
 * switching, section visibility, and the Add Category dialog trigger.
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

  test("renders tabs for Menu Items and Riders", async ({ page }) => {
    await goto(page, "/vendor/config");
    await expect(page.getByRole("tab", { name: "Menu Items" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Riders" })).toBeVisible();
  });

  test("Menu Items tab shows category, option, and item sections", async ({
    page,
  }) => {
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
  });

  test("switching to Riders tab shows rider section", async ({ page }) => {
    await goto(page, "/vendor/config");
    await page.getByRole("tab", { name: "Riders" }).click();
    await expect(
      page.getByRole("heading", { name: "Your Riders" }),
    ).toBeVisible();
  });

  test("Add Category button opens the dialog", async ({ page }) => {
    await goto(page, "/vendor/config");

    const addCategoryBtn = page.getByTestId("add-category-button");
    await expect(addCategoryBtn).toBeVisible();
    await addCategoryBtn.click();

    await expect(
      page.getByRole("heading", { name: "Add a New Category" }),
    ).toBeVisible();
    await expect(page.getByLabel("Category Name")).toBeVisible();
  });
});

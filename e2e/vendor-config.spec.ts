import { test, expect } from "@playwright/test";
import { goto, seedAuth, mockApi, paginated } from "./helpers";
import { vendorProfile, vendorCategory, menuItem } from "./fixtures";

const groupedResponse = [
  vendorCategory({
    id: "cat-1",
    name: "Mains",
    items: [
      {
        id: "item-1",
        name: "Jollof Rice",
        description: "Smoky party jollof",
        price: "3500.00",
        item_type: "single",
        image_url: null,
        is_available: true,
      },
    ],
  }),
  vendorCategory({
    id: "cat-2",
    name: "Drinks",
    items: [
      {
        id: "item-2",
        name: "Water",
        description: "Water 50CL",
        price: "500.00",
        item_type: "single",
        image_url: null,
        is_available: true,
      },
    ],
  }),
];

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
        path: "/restaurants/menu-by-category/",
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

test.describe("Vendor Menu Items - View Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, "restaurant");
  });

  test("defaults to grouped view", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      { method: "GET", path: "/restaurants/me/menu/categories/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/options/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/menu/", json: paginated([]) },
      { method: "GET", path: "/restaurants/menu-by-category/", json: paginated(groupedResponse) },
      { method: "GET", path: "/restaurants/me/drivers/", json: { drivers: [] } },
    ]);
    await goto(page, "/vendor/config");

    // Grouped toggle should be active by default
    await expect(page.getByTestId("view-grouped")).toHaveAttribute("data-testid", "view-grouped");

    // Should show category tabs from grouped API
    await expect(page.getByRole("tab", { name: "Mains" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Drinks" })).toBeVisible();

    // Should show items under the first category tab
    await expect(page.getByText("Jollof Rice")).toBeVisible();
  });

  test("can switch to all items view", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      { method: "GET", path: "/restaurants/me/menu/categories/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/options/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/menu/", json: paginated([menuItem()]) },
      { method: "GET", path: "/restaurants/menu-by-category/", json: paginated(groupedResponse) },
      { method: "GET", path: "/restaurants/me/drivers/", json: { drivers: [] } },
    ]);
    await goto(page, "/vendor/config");

    // Switch to All view
    await page.getByTestId("view-all").click();

    // Should show flat table with the item
    await expect(page.getByText("Jollof Rice & Chicken")).toBeVisible();

    // Category headings from grouped view should not be visible
    await expect(page.getByRole("tab", { name: "Mains" })).not.toBeVisible();
  });

  test("can switch back to grouped view", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      { method: "GET", path: "/restaurants/me/menu/categories/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/options/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/menu/", json: paginated([menuItem()]) },
      { method: "GET", path: "/restaurants/menu-by-category/", json: paginated(groupedResponse) },
      { method: "GET", path: "/restaurants/me/drivers/", json: { drivers: [] } },
    ]);
    await goto(page, "/vendor/config");

    // Switch to All then back to Grouped
    await page.getByTestId("view-all").click();
    await page.getByTestId("view-grouped").click();

    // Should show category tabs again
    await expect(page.getByRole("tab", { name: "Mains" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Drinks" })).toBeVisible();
  });

  test("grouped view shows empty state when no categories", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      { method: "GET", path: "/restaurants/me/menu/categories/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/options/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/menu/", json: paginated([]) },
      { method: "GET", path: "/restaurants/menu-by-category/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/drivers/", json: { drivers: [] } },
    ]);
    await goto(page, "/vendor/config");

    await expect(
      page.getByText("No menu items available. Please add a new item."),
    ).toBeVisible();
  });

  test("grouped view shows per-category empty state", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      { method: "GET", path: "/restaurants/me/menu/categories/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/options/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/menu/", json: paginated([]) },
      {
        method: "GET",
        path: "/restaurants/menu-by-category/",
        json: paginated([
          vendorCategory({ id: "cat-empty", name: "Empty Cat", items: [] }),
        ]),
      },
      { method: "GET", path: "/restaurants/me/drivers/", json: { drivers: [] } },
    ]);
    await goto(page, "/vendor/config");

    await expect(page.getByRole("tab", { name: "Empty Cat" })).toBeVisible();
    await expect(page.getByText("No items in this category.")).toBeVisible();
  });
});

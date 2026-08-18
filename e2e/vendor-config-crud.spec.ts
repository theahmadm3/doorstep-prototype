import { test, expect } from "@playwright/test";
import { goto, seedAuth, mockApi, paginated } from "./helpers";
import { vendorProfile, vendorCategory, vendorOptionGroup, vendorRider } from "./fixtures";

test.describe("Vendor Config - Category CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, "restaurant");
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      { method: "GET", path: "/restaurants/me/menu/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/options/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/drivers/", json: { drivers: [] } },
    ]);
  });

  test("can create a category", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      { method: "GET", path: "/restaurants/me/menu/categories/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/menu/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/options/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/drivers/", json: { drivers: [] } },
      {
        method: "POST",
        path: "/restaurants/me/menu/categories/",
        json: vendorCategory({ id: "cat-new", name: "Drinks" }),
      },
    ]);
    await goto(page, "/vendor/config");

    await page.getByTestId("add-category-button").click();
    await page.getByLabel("Category Name").fill("Drinks");

    const createCall = page.waitForRequest(
      (req) =>
        req.method() === "POST" &&
        req.url().includes("/restaurants/me/menu/categories/"),
    );
    await page.getByRole("button", { name: "Add Category" }).click();
    await createCall;

    await expect(page.getByText("Category Created")).toBeVisible();
  });

  test("can edit a category", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      { method: "GET", path: "/restaurants/me/menu/categories/", json: paginated([vendorCategory()]) },
      { method: "GET", path: "/restaurants/me/menu/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/options/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/drivers/", json: { drivers: [] } },
      {
        method: "PUT",
        path: /\/restaurants\/me\/menu\/categories\/cat-1\//,
        json: vendorCategory({ name: "Updated Mains" }),
      },
    ]);
    await goto(page, "/vendor/config");

    await page.getByText("Mains").click();
    await page.getByLabel("Category Name").fill("Updated Mains");

    const updateCall = page.waitForRequest(
      (req) =>
        req.method() === "PUT" &&
        /\/restaurants\/me\/menu\/categories\/cat-1\//.test(req.url()),
    );
    await page.getByRole("button", { name: "Save Changes" }).click();
    await updateCall;

    await expect(page.getByText("Category Updated")).toBeVisible();
  });

  test("can delete a category", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      { method: "GET", path: "/restaurants/me/menu/categories/", json: paginated([vendorCategory()]) },
      { method: "GET", path: "/restaurants/me/menu/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/options/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/drivers/", json: { drivers: [] } },
      {
        method: "DELETE",
        path: /\/restaurants\/me\/menu\/categories\/cat-1\//,
        json: {},
      },
    ]);
    await goto(page, "/vendor/config");

    await page.getByText("Mains").click();
    await page.getByRole("button", { name: "Delete" }).click();

    await page.getByRole("button", { name: "Continue" }).click();

    await expect(page.getByText("Category Deleted")).toBeVisible();
  });
});

test.describe("Vendor Config - Rider CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, "restaurant");
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      { method: "GET", path: "/restaurants/me/menu/categories/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/menu/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/options/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/drivers/", json: { drivers: [] } },
    ]);
  });

  test("can add a rider", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      { method: "GET", path: "/restaurants/me/menu/categories/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/menu/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/options/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/drivers/", json: { drivers: [] } },
      {
        method: "POST",
        path: "/restaurants/me/drivers/",
        json: vendorRider(),
      },
    ]);
    await goto(page, "/vendor/config");
    await page.getByRole("tab", { name: "Riders" }).click();

    await page.getByRole("button", { name: "Add Rider" }).click();
    await page.getByLabel("Full Name").fill("Tunde Rider");
    await page.getByLabel("Email").fill("tunde@doorstep.com");
    await page.getByLabel("Phone Number").fill("08098765432");

    const createCall = page.waitForRequest(
      (req) =>
        req.method() === "POST" &&
        req.url().includes("/restaurants/me/drivers/"),
    );
    await page.getByRole("button", { name: "Save Changes" }).click();
    await createCall;

    await expect(page.getByText("Rider Added")).toBeVisible();
  });

  test("shows empty state when no riders", async ({ page }) => {
    await goto(page, "/vendor/config");
    await page.getByRole("tab", { name: "Riders" }).click();

    await expect(page.getByText("You haven't added any riders yet.")).toBeVisible();
  });

  test("shows rider list when riders exist", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      { method: "GET", path: "/restaurants/me/menu/categories/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/menu/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/options/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/drivers/", json: { drivers: [vendorRider()] } },
    ]);
    await goto(page, "/vendor/config");
    await page.getByRole("tab", { name: "Riders" }).click();

    await expect(page.getByText("Tunde Rider")).toBeVisible();
    await expect(page.getByText("tunde@doorstep.com")).toBeVisible();
  });
});

test.describe("Vendor Config - Category Empty State", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, "restaurant");
  });

  test("shows empty state when no categories", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      { method: "GET", path: "/restaurants/me/menu/categories/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/menu/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/options/", json: paginated([]) },
      { method: "GET", path: "/restaurants/me/drivers/", json: { drivers: [] } },
    ]);
    await goto(page, "/vendor/config");

    await expect(
      page.getByText("No categories found. Add your first one to get started."),
    ).toBeVisible();
  });
});

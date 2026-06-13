import { test, expect } from "@playwright/test";
import { goto, seedAuth, mockApi, paginated } from "./helpers";
import { adminUser, adminOrder } from "./fixtures";

/**
 * Authenticated admin tables, fully mocked. The users + orders tables are
 * backed by the API; the riders table is backed by local mock data and only
 * needs an authenticated admin to render.
 */
test.describe("Admin (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, "admin");
  });

  test("dashboard users table renders rows", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/admin/users/", json: paginated([adminUser()]) },
    ]);
    await goto(page, "/admin/dashboard");

    await expect(
      page.getByRole("columnheader", { name: "Full Name" }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "Ada Customer" })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "ada@doorstep.com" }),
    ).toBeVisible();
  });

  test("orders table renders rows", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/admin/orders/", json: paginated([adminOrder()]) },
    ]);
    await goto(page, "/admin/orders");

    await expect(
      page.getByRole("columnheader", { name: "Order ID" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Mama Put Kitchen" }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "Ada Customer" })).toBeVisible();
  });

  test("riders table renders", async ({ page }) => {
    await mockApi(page); // no API calls — local mock data
    await goto(page, "/admin/riders");

    await expect(
      page.getByRole("columnheader", { name: "Vehicle" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Name" }),
    ).toBeVisible();
  });
});

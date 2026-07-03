import { test, expect } from "@playwright/test";
import { goto, seedAuth, mockApi, paginated } from "./helpers";
import {
  dashboardData,
  menuItem,
  address,
  customerOrder,
} from "./fixtures";

/**
 * Authenticated customer journey, fully mocked (no live backend):
 * dashboard → open a restaurant → see its menu → add an item to the cart,
 * plus the orders list. The final Paystack payment step is intentionally out
 * of scope (it hands off to an external gateway).
 */
test.describe("Customer (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, "customer");
    // `/addresses/` must be non-empty, otherwise the layout forces the
    // address modal open and blocks the page.
    await mockApi(page, [
      { method: "GET", path: "/addresses/", json: paginated([address()]) },
      { method: "GET", path: "/dashboard/", json: dashboardData() },
      {
        method: "GET",
        path: /^\/restaurants\/[^/]+\/menu\/$/,
        json: paginated([
          menuItem(),
          menuItem({ id: "item-2", name: "Suya Wrap", price: "2500.00" }),
        ]),
      },
      {
        method: "GET",
        path: "/get-customer-order",
        json: paginated([customerOrder()]),
      },
    ]);
  });

  test("dashboard renders and lists a restaurant", async ({ page }) => {
    await goto(page, "/customer/dashboard");
    // Greeting heading is dynamic (time-based); check the static sub-text.
    await expect(
      page.getByText("What would you like to eat today?"),
    ).toBeVisible();
    await expect(page.getByText("Mama Put Kitchen").first()).toBeVisible();
  });

  test("open a restaurant, see the menu, and add an item to the cart", async ({
    page,
  }) => {
    await goto(page, "/customer/dashboard");

    await page.getByText("Mama Put Kitchen").first().click();
    await expect(page).toHaveURL(/\/customer\/restaurants\/rest-1$/);

    const item = page.getByText("Jollof Rice & Chicken").first();
    await expect(item).toBeVisible();

    await item.click();
    const addButton = page.getByRole("button", { name: /Add to Cart - ₦/ });
    await expect(addButton).toBeVisible();
    await addButton.click();

    await expect(page.getByText("View Order")).toBeVisible();
  });

  test("orders page shows active orders", async ({ page }) => {
    await goto(page, "/customer/orders");
    await expect(
      page.getByRole("heading", { name: "Your Orders" }),
    ).toBeVisible();
    // Active tab is default; the mocked order from /get-customer-order surfaces.
    await expect(page.getByText("Mama Put Kitchen").first()).toBeVisible();
  });

  test("orders page has Cart, Active, and Past tabs", async ({ page }) => {
    await goto(page, "/customer/orders");
    await expect(page.getByRole("tab", { name: /Cart/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Active/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Past/i })).toBeVisible();
  });

  test("empty cart tab shows placeholder text", async ({ page }) => {
    await goto(page, "/customer/orders");
    await page.getByRole("tab", { name: /Cart/i }).click();
    await expect(page.getByText("Your cart is empty.")).toBeVisible();
  });
});

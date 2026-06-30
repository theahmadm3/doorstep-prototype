import { test, expect } from "@playwright/test";
import { goto, seedAuth, mockApi, paginated } from "./helpers";
import {
  restaurant,
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
    // (Google-Maps-backed) address modal open and blocks the page.
    await mockApi(page, [
      { method: "GET", path: "/addresses/", json: paginated([address()]) },
      { method: "GET", path: "/restaurants/", json: paginated([restaurant()]) },
      {
        method: "GET",
        path: /^\/restaurants\/[^/]+\/menu\/$/,
        json: paginated([menuItem(), menuItem({ id: "item-2", name: "Suya Wrap", price: "2500.00" })]),
      },
      {
        method: "GET",
        path: "/get-customer-order",
        json: paginated([customerOrder()]),
      },
    ]);
  });

  test("dashboard lists restaurants", async ({ page }) => {
    await goto(page, "/customer/dashboard");
    await expect(
      page.getByRole("heading", { name: "Explore & Order" }),
    ).toBeVisible();
    await expect(page.getByText("Mama Put Kitchen")).toBeVisible();
  });

  test("open a restaurant, see the menu, and add an item to the cart", async ({
    page,
  }) => {
    await goto(page, "/customer/dashboard");

    // Click through so the restaurant is set in the UI store (the detail page
    // requires it) and the URL changes to the restaurant route.
    await page.getByText("Mama Put Kitchen").click();
    await expect(page).toHaveURL(/\/customer\/restaurants\/rest-1$/);

    // Menu rendered from the mocked endpoint.
    const item = page.getByText("Jollof Rice & Chicken").first();
    await expect(item).toBeVisible();

    // Open the add-to-cart modal and add the item.
    await item.click();
    const addButton = page.getByRole("button", { name: /Add to Cart - ₦/ });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // The floating "View Order" control confirms the cart now has contents.
    await expect(page.getByText("View Order")).toBeVisible();
  });

  test("orders page shows the customer's orders", async ({ page }) => {
    await goto(page, "/customer/orders");
    await expect(
      page.getByRole("heading", { name: "Your Orders" }),
    ).toBeVisible();
    // The active order from the mocked /get-customer-order surfaces by name.
    await expect(page.getByText("Mama Put Kitchen").first()).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";
import { goto, seedAuth, mockApi, paginated } from "./helpers";
import { vendorOrder, vendorProfile, vendorAnalytics } from "./fixtures";

// The vendor layout fetches the profile on mount and force-opens an address
// modal (which loads Google Maps and covers the page) when no address is set.
// Every vendor test mocks the profile with an address present to avoid it.

/**
 * Authenticated vendor order management, fully mocked. Covers the dashboard
 * summary and the core incoming-order action (Accept), asserting the action
 * fires the correct backend call.
 */
test.describe("Vendor (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, "restaurant");
  });

  test("dashboard shows the restaurant summary", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/restaurant/me/analytics", json: vendorAnalytics() },
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      {
        method: "GET",
        path: "/restaurants/me/orders/",
        json: paginated([vendorOrder()]),
      },
    ]);
    await goto(page, "/vendor/dashboard");

    await expect(
      page.getByRole("heading", { name: "Welcome back, Mama Put Kitchen!" }),
    ).toBeVisible();
    await expect(page.getByText("Total Revenue")).toBeVisible();
  });

  test("incoming order renders and can be accepted", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      {
        method: "GET",
        path: "/restaurants/me/orders/",
        json: paginated([vendorOrder({ customer_name: "Ada Customer", status: "Pending" })]),
      },
      // Accept action endpoint: /restaurants/me/orders/{id}/accept/
      { method: "POST", path: /\/restaurants\/me\/orders\/[^/]+\/accept\/$/, json: {} },
    ]);
    await goto(page, "/vendor/orders");

    // The Pending order shows on the default "Incoming" tab.
    await expect(page.getByText("Ada Customer")).toBeVisible();

    const accept = page.getByRole("button", { name: "Accept" });
    await expect(accept).toBeVisible();

    // Clicking Accept must fire the accept call to the backend.
    const acceptCall = page.waitForRequest(
      (req) =>
        req.method() === "POST" && /\/restaurants\/me\/orders\/[^/]+\/accept\/$/.test(req.url()),
    );
    await accept.click();
    await acceptCall;
  });
});

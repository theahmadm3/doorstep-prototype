import { test, expect } from "@playwright/test";
import { goto, seedAuth, mockApi, paginated } from "./helpers";
import { vendorOrder, vendorProfile, vendorAnalytics } from "./fixtures";

// The vendor layout fetches the profile on mount and force-opens an address
// modal (which loads Google Maps and covers the page) when no address is set.
// Every vendor test mocks the profile with an address present to avoid it.

/**
 * Authenticated vendor order management, fully mocked. Covers the dashboard
 * summary and the core incoming-order actions (Accept / Reject), tab
 * navigation, and the ongoing order status progression.
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
        json: paginated([
          vendorOrder({ customer_name: "Ada Customer", status: "Pending", order_type: "pickup" }),
        ]),
      },
      {
        method: "POST",
        path: /\/restaurants\/me\/orders\/[^/]+\/accept\/$/,
        json: {},
      },
    ]);
    await goto(page, "/vendor/orders");

    await expect(page.getByText("Ada Customer")).toBeVisible();

    const accept = page.getByRole("button", { name: "Accept" });
    await expect(accept).toBeVisible();

    const acceptCall = page.waitForRequest(
      (req) =>
        req.method() === "POST" &&
        /\/restaurants\/me\/orders\/[^/]+\/accept\/$/.test(req.url()),
    );
    await accept.click();
    await acceptCall;
  });

  test("incoming order can be rejected", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      {
        method: "GET",
        path: "/restaurants/me/orders/",
        json: paginated([
          vendorOrder({ customer_name: "Bola Customer", status: "Pending", order_type: "pickup" }),
        ]),
      },
      {
        method: "POST",
        path: /\/restaurants\/me\/orders\/[^/]+\/reject\/$/,
        json: {},
      },
    ]);
    await goto(page, "/vendor/orders");

    await expect(page.getByText("Bola Customer")).toBeVisible();

    const reject = page.getByRole("button", { name: "Reject" });
    await expect(reject).toBeVisible();

    const rejectCall = page.waitForRequest(
      (req) =>
        req.method() === "POST" &&
        /\/restaurants\/me\/orders\/[^/]+\/reject\/$/.test(req.url()),
    );
    await reject.click();
    await rejectCall;
  });

  test("orders page has Incoming, Ongoing, Ready, and On the Way tabs", async ({
    page,
  }) => {
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      { method: "GET", path: "/restaurants/me/orders/", json: paginated([]) },
    ]);
    await goto(page, "/vendor/orders");

    await expect(
      page.getByRole("heading", { name: "Manage Orders" }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /Incoming/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Ongoing/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Ready/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /On the Way/i })).toBeVisible();
  });

  test("accepted order appears on the Ongoing tab", async ({ page }) => {
    await mockApi(page, [
      { method: "GET", path: "/restaurants/me/", json: vendorProfile() },
      {
        method: "GET",
        path: "/restaurants/me/orders/",
        json: paginated([
          vendorOrder({ customer_name: "Chidi Customer", status: "Accepted", order_type: "pickup" }),
        ]),
      },
    ]);
    await goto(page, "/vendor/orders");

    await page.getByRole("tab", { name: /Ongoing/i }).click();
    await expect(page.getByText("Chidi Customer")).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";
import { goto, seedAuth, mockApi, seedGeolocation } from "./helpers";
import { riderOrder } from "./fixtures";

/**
 * Authenticated rider pickup/delivery, fully mocked. The rider layout pings
 * the rider's location on mount, so geolocation is stubbed and the location
 * endpoint mocked to keep the page deterministic. Covers an ongoing delivery
 * reaching the OTP-confirmation step.
 */
test.describe("Rider (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page, "driver");
    await seedGeolocation(page);
    await mockApi(page, [
      { method: "PATCH", path: "/drivers/me/location", json: {} },
      {
        method: "GET",
        path: "/drivers/orders/",
        json: { success: true, data: [riderOrder({ status: "Arrived at Destination" })] },
      },
      // Deliver action: /drivers/orders/{id}/deliver/ → { data: RiderOrder }
      {
        method: "POST",
        path: /\/drivers\/orders\/[^/]+\/deliver\/$/,
        json: { data: riderOrder({ status: "Delivered" }) },
      },
    ]);
  });

  test("ongoing delivery shows and reaches OTP confirmation", async ({ page }) => {
    await goto(page, "/rider/orders");

    await expect(
      page.getByRole("heading", { name: "Your Deliveries" }),
    ).toBeVisible();

    // The mocked ongoing order card (id "order-ride-0001abcd" → slice(0,8)).
    await expect(page.getByText("Order #order-ri")).toBeVisible();
    await expect(page.getByText("Ada Customer")).toBeVisible();

    // At "Arrived at Destination" the deliver action is available.
    const deliver = page.getByRole("button", { name: "Deliver (Confirm OTP)" });
    await expect(deliver).toBeVisible();
    await deliver.click();

    // OTP modal opens; submitting fires the deliver call.
    await expect(
      page.getByRole("heading", { name: "Confirm Delivery" }),
    ).toBeVisible();
    await page.getByPlaceholder("123456").fill("123456");

    const deliverCall = page.waitForRequest(
      (req) =>
        req.method() === "POST" && /\/drivers\/orders\/[^/]+\/deliver\/$/.test(req.url()),
    );
    await page.getByRole("button", { name: "Confirm Delivery" }).click();
    await deliverCall;
  });
});

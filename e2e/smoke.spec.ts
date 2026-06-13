import { test, expect } from "@playwright/test";
import { captureErrors } from "./helpers";

// Pages reachable without authentication.
const publicPages = [
  { name: "Home / login", path: "/" },
  { name: "Signup", path: "/signup" },
  { name: "Rider signup", path: "/signup/rider" },
  { name: "Vendor signup", path: "/signup/vendor" },
  { name: "Partner login", path: "/secret/non-accessible/to/customers/login" },
];

test.describe("Smoke: public pages load without JS errors", () => {
  for (const { name, path } of publicPages) {
    test(`${name} (${path}) loads cleanly`, async ({ page }) => {
      const errors = captureErrors(page);
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });

      // The document itself must not be a server error.
      expect(response?.status() ?? 200).toBeLessThan(400);

      // Page produced visible content.
      await expect(page.locator("body")).not.toBeEmpty();

      // Ignore noise unrelated to app correctness (network/asset 404s, PWA).
      const appErrors = errors.filter(
        (e) =>
          !/Failed to load resource/i.test(e) &&
          !/manifest/i.test(e) &&
          !/service worker|sw\.js|workbox/i.test(e) &&
          !/favicon/i.test(e),
      );
      expect(appErrors, appErrors.join("\n")).toEqual([]);
    });
  }
});

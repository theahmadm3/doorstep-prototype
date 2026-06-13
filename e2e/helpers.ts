import { Page, expect } from "@playwright/test";

export const SECRET_LOGIN_PATH = "/secret/non-accessible/to/customers/login";

/**
 * Navigate and wait only for DOM content. Several pages keep network
 * connections open (websockets, polling, long-running backend calls), so the
 * "load" event may never fire — waiting for it causes false timeouts.
 */
export async function goto(page: Page, path: string) {
  return page.goto(path, { waitUntil: "domcontentloaded" });
}

/**
 * The home (`/`) and `/signup` pages gate the real form behind a WhatsApp
 * onboarding step. This clicks "Continue" to reveal the underlying form.
 */
export async function passWhatsappGate(page: Page) {
  const continueBtn = page.getByRole("button", { name: "Continue" });
  await expect(continueBtn).toBeVisible();
  await continueBtn.click();
}

/** Collect uncaught page errors and console.error messages during a test. */
export function captureErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  return errors;
}

/** Seed a logged-in user into localStorage before the app boots. */
export async function seedAuth(
  page: Page,
  role: "customer" | "restaurant" | "driver" | "admin",
) {
  await page.addInitScript((r) => {
    localStorage.setItem("accessToken", "test-token");
    localStorage.setItem("token", "test-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "test-id",
        role: r,
        full_name: "Test User",
        email: "test@doorstep.com",
      }),
    );
  }, role);
}

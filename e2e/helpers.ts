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

/**
 * A single mocked API endpoint. `path` is matched against the request path
 * AFTER the trailing `/api` (e.g. `/restaurants/`), ignoring the query string.
 * Provide a string for an exact match or a RegExp for patterns
 * (e.g. parameterised routes like `/restaurants/123/menu/`).
 */
export interface ApiMock {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string | RegExp;
  status?: number;
  json?: unknown;
}

/**
 * Make the app hermetic: intercept every `${VITE_BASE_URL}` call (all paths
 * contain `/api/`) and serve fixtures instead of hitting the live Render
 * backend. Unmatched requests get an empty-but-valid payload so the common
 * `.results` / `.data` unwraps never throw and nothing escapes to the network.
 *
 * Call this BEFORE navigating.
 */
export async function mockApi(page: Page, mocks: ApiMock[] = []) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const method = request.method();
    // Strip everything up to and including the first `/api`, leaving the
    // backend-relative path the app code uses (e.g. `/restaurants/`).
    const path = new URL(request.url()).pathname.replace(/^.*?\/api/, "");

    const match = mocks.find((m) => {
      if (m.method && m.method !== method) return false;
      return typeof m.path === "string" ? path === m.path : m.path.test(path);
    });

    if (match) {
      await route.fulfill({
        status: match.status ?? 200,
        contentType: "application/json",
        body: JSON.stringify(match.json ?? {}),
      });
      return;
    }

    // Hermetic fallback — never reach the real backend.
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        count: 0,
        next: null,
        previous: null,
        results: [],
        data: [],
        success: true,
      }),
    });
  });
}

/** Build a paginated response envelope (`{count,next,previous,results}`). */
export function paginated<T>(results: T[]) {
  return { count: results.length, next: null, previous: null, results };
}

/**
 * Stub `navigator.geolocation` before the app boots so location-dependent
 * code (the rider layout's location ping) resolves instantly instead of
 * prompting / hanging in headless Chromium.
 */
export async function seedGeolocation(page: Page, lat = 6.5244, lng = 3.3792) {
  await page.addInitScript(
    ([la, ln]) => {
      const coords = {
        latitude: la,
        longitude: ln,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      };
      const position = { coords, timestamp: 0 };
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition: (success: PositionCallback) =>
            success(position as GeolocationPosition),
          watchPosition: (success: PositionCallback) => {
            success(position as GeolocationPosition);
            return 0;
          },
          clearWatch: () => {},
        },
      });
    },
    [lat, lng],
  );
}

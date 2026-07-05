import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { restoreAuthFromBackup } from "./lib/auth";

// Register the single service worker as early as possible. It runs on every
// load — even for users who never opt into push notifications — so the PWA
// install criteria (manifest + SW with fetch handler) are always met.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/push-sw.js").catch((err) => {
      // Failure here is non-fatal: push subscription will surface a clearer
      // error if the SW is required and missing.
      console.error("[main] Service worker registration failed:", err);
    });
  });
}

async function bootstrap() {
  // If iOS wiped localStorage but the IndexedDB mirror survived, restore the
  // session BEFORE the router's auth guard runs its synchronous check.
  // Race against a timeout so a broken IndexedDB can never block first paint.
  try {
    await Promise.race([
      restoreAuthFromBackup(),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch {
    /* best effort — render regardless */
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();

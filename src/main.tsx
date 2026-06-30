import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

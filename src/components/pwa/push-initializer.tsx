
"use client";

import { usePushManager } from "@/hooks/use-push-manager";

/**
 * This is a global, layout-level component that initializes the push notification
 * service worker and state. It renders nothing to the DOM.
 */
export default function PushInitializer() {
  usePushManager(); // Initialize the hook
  return null;
}

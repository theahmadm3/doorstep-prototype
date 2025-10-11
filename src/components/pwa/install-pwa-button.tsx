
"use client";

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import IOSInstallModal from "./ios-install-modal";
import { Download } from "lucide-react";
import { useEffect } from "react";

export default function InstallPWAButton() {
  const { shouldShowInstallButton, showIOSModal, setShowIOSModal, handleInstall } = usePWAInstall();

  // Register service worker on component mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
        .catch((error) => console.error('Service Worker registration failed:', error));
    }
  }, []);

  if (!shouldShowInstallButton) {
    return null;
  }

  return (
    <>
      <Button onClick={handleInstall} className="w-full">
        <Download className="mr-2 h-4 w-4" />
        Install App
      </Button>
      <IOSInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
      />
    </>
  );
}

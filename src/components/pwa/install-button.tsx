"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isInStandaloneMode = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");

    setIsStandalone(isInStandaloneMode());

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // On iOS, show install prompt if not in standalone mode
    if (isIOSDevice && !isInStandaloneMode()) {
      setShowInstallPrompt(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS instructions
      setShowIOSInstructions(true);
    } else if (deferredPrompt) {
      // Show the install prompt for Android/Desktop
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      }
    }
  };

  // Don't show the button if already installed
  if (isStandalone) {
    return null;
  }

  // Don't show if not installable
  if (!showInstallPrompt) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className="w-full gap-2"
      >
        <Download className="h-4 w-4" />
        Install App
      </Button>

      {/* iOS Installation Instructions Dialog */}
      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install Doorstep App</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p>To install this app on your iOS device:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  Tap the <Share className="inline h-4 w-4" /> Share button in
                  Safari
                </li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right corner</li>
              </ol>
              <p className="text-sm text-muted-foreground mt-4">
                The app will appear on your home screen like any other app.
              </p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}

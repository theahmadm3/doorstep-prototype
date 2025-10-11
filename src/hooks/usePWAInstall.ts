
"use client";

import { useState, useEffect, useCallback } from 'react';

// This interface is required for the `beforeinstallprompt` event.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

type PWASupport = 'native' | 'ios' | 'unsupported';

export const usePWAInstall = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Detect if the app is already running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setInstallPromptEvent(event);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (installPromptEvent) {
      // Trigger the native browser install prompt (Android/Desktop)
      installPromptEvent.prompt();
      const { outcome } = await installPromptEvent.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the PWA installation');
      } else {
        console.log('User dismissed the PWA installation');
      }
      setInstallPromptEvent(null);
      setCanInstall(false);
    } else if (isIOS) {
      // For iOS, show a helpful modal
      setShowIOSModal(true);
    }
  }, [installPromptEvent, isIOS]);
  
  const pwaSupport: PWASupport = installPromptEvent ? 'native' : isIOS ? 'ios' : 'unsupported';
  const shouldShowInstallButton = !isInstalled && pwaSupport !== 'unsupported';

  return {
    shouldShowInstallButton,
    isIOS,
    showIOSModal,
    setShowIOSModal,
    handleInstall,
  };
};

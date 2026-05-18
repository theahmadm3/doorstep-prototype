"use client";

import { useState, useEffect } from "react";
import { X, Download, Share, Plus, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PWAInstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
	const [showPrompt, setShowPrompt] = useState(false);
	const [isIOS, setIsIOS] = useState(false);

	useEffect(() => {
		// Detect iOS
		const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
		const isStandalone = window.matchMedia(
			"(display-mode: standalone)",
		).matches || (window.navigator as any).standalone === true;

		setIsIOS(iOS);

		// Show iOS prompt if on iOS and not already installed
		if (iOS && !isStandalone) {
			// Check if user has dismissed before
			const dismissed = localStorage.getItem("pwa-prompt-dismissed");
			const dismissedTime = dismissed ? parseInt(dismissed) : 0;
			const daysSinceDismissed =
				(Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

			// Show again after 7 days
			if (!dismissed || daysSinceDismissed > 7) {
				setTimeout(() => setShowPrompt(true), 5000); // Show after 5 seconds
			}
		}

		// Android/Chrome install prompt
		const handler = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e);

			// Check dismissal for Android too
			const dismissed = localStorage.getItem("pwa-prompt-dismissed");
			const dismissedTime = dismissed ? parseInt(dismissed) : 0;
			const daysSinceDismissed =
				(Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

			if (!dismissed || daysSinceDismissed > 7) {
				setShowPrompt(true);
			}
		};

		window.addEventListener("beforeinstallprompt", handler);

		return () => {
			window.removeEventListener("beforeinstallprompt", handler);
		};
	}, []);

	const handleInstallClick = async () => {
		if (!deferredPrompt) return;

		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		console.log(`User response: ${outcome}`);

		setDeferredPrompt(null);
		setShowPrompt(false);
	};

	const handleDismiss = () => {
		setShowPrompt(false);
		localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
	};

	if (!showPrompt) return null;

	// iOS Instructions
	if (isIOS) {
		return (
			<div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t shadow-2xl p-6 z-50 animate-slide-up">
				<button
					onClick={handleDismiss}
					className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
				>
					<X className="h-5 w-5" />
				</button>

				<div className="max-w-md mx-auto">
					<div className="flex items-center gap-3 mb-3">
						<Download className="h-7 w-7 text-primary" />
						<h3 className="font-bold text-xl">Install Our App</h3>
					</div>

					<p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
						Install this app on your iPhone for quick access and offline
						functionality!
					</p>

					<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
						<p className="text-sm font-medium mb-3">Follow these steps:</p>
						<ol className="space-y-3 text-sm">
							<li className="flex items-center gap-3">
								<span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
									1
								</span>
								<span className="flex items-center gap-2">
									Tap the{" "}
									<Share className="h-5 w-5 text-blue-600 dark:text-blue-400 inline" />{" "}
									Share button below
								</span>
							</li>
							<li className="flex items-center gap-3">
								<span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
									2
								</span>
								<span className="flex items-center gap-2">
									Scroll and tap <Plus className="h-4 w-4 inline" />
									<Square className="h-4 w-4 inline" /> "Add to Home Screen"
								</span>
							</li>
							<li className="flex items-center gap-3">
								<span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
									3
								</span>
								<span>Tap "Add" to confirm</span>
							</li>
						</ol>
					</div>

					<Button onClick={handleDismiss} variant="outline" className="w-full">
						Got it!
					</Button>
				</div>
			</div>
		);
	}

	// Android/Chrome Install Button
	return (
		<div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 z-50 animate-slide-up">
			<button
				onClick={handleDismiss}
				className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
			>
				<X className="h-5 w-5" />
			</button>

			<div className="pr-6">
				<div className="flex items-center gap-3 mb-2">
					<Download className="h-6 w-6 text-primary" />
					<h3 className="font-bold text-lg">Install App</h3>
				</div>
				<p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
					Install our app for a better experience and offline access!
				</p>
				<div className="flex gap-2">
					<Button onClick={handleInstallClick} className="flex-1">
						Install
					</Button>
					<Button onClick={handleDismiss} variant="outline" className="flex-1">
						Not Now
					</Button>
				</div>
			</div>
		</div>
	);
}

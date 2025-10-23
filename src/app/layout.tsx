import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import PWAInstallPrompt from "@/components/pwa-install-prompt";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-poppins",
});

export const metadata: Metadata = {
	title: "Doorstep",
	description: "Your favourite food, delivered to your doorstep.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${inter.variable} ${poppins.variable} h-full`}>
			<head>
				<link rel="manifest" href="/manifest.json" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<link rel="apple-touch-icon" href="/icons/apple-icon-180.png" />
				<meta name="theme-color" content="#3c7fec" />
			</head>
			<body className="antialiased flex flex-col h-full bg-background">
				<Providers>
					{children}
					<PWAInstallPrompt />
					<Toaster />
				</Providers>
			</body>
		</html>
	);
}

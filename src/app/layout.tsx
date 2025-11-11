import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import PWAInstallPrompt from "@/components/pwa-install-prompt";
import AuthGuard from "@/components/auth/auth-guard";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-poppins",
});

export const metadata: Metadata = {
	title: "Doorstep",
	description: "Your favourite food, delivered to your doorstep.",
	manifest: "/manifest.json",
	themeColor: "#005380",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Doorstep",
	},
	icons: {
		apple: [
			{
				url: "/icons/apple-icon-180.png",
				sizes: "180x180",
				type: "image/png",
			},
		],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${inter.variable} ${poppins.variable} h-full`}>
			<body className="antialiased flex flex-col h-full bg-background">
				<Providers>
					<AuthGuard>
						{children}
					</AuthGuard>
					<PWAInstallPrompt />
					<Toaster />
				</Providers>
			</body>
		</html>
	);
}

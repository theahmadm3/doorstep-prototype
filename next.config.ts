import type { NextConfig } from "next";
import nextPWA from "next-pwa";

const withPWA = nextPWA({
	dest: "public",
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === "development",
	scope: "/",
	maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
	// Important for static export
	buildExcludes: ["middleware-manifest.json", "app-build-manifest.json"],
});

const nextConfig: NextConfig = {
	// ⭐ Add static export
	output: "export",

	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	images: {
		unoptimized: true, // ⭐ Required for static export
		remotePatterns: [
			{
				protocol: "https",
				hostname: "placehold.co",
				port: "",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
				port: "",
				pathname: "/**",
			},
		],
	},
	// ⭐ Optional: Add trailing slashes for better cPanel compatibility
	trailingSlash: true,
};

export default withPWA(nextConfig);

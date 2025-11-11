import type { NextConfig } from "next";
import nextPWA from "next-pwa";

const withPWA = nextPWA({
	dest: "public",
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === "development",
	scope: "/",
	maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
	// Use a custom service worker source so we can add push event handlers
	// next-pwa will run workbox injectManifest on this file and output public/sw.js
	swSrc: "service-worker.js",
});

const nextConfig: NextConfig = {
	/* config options here */
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	images: {
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
};

export default withPWA(nextConfig);

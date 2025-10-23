declare module "next-pwa" {
    import type { NextConfig } from "next";
    
    interface PWAConfig {
      dest: string;
      register?: boolean;
      skipWaiting?: boolean;
      disable?: boolean;
      scope?: string;
      maximumFileSizeToCacheInBytes?: number;
      // Add any other options you might use
      sw?: string;
      publicExcludes?: string[];
      buildExcludes?: string[];
      fallbacks?: {
        image?: string;
        document?: string;
        font?: string;
        audio?: string;
        video?: string;
      };
    }
    
    function nextPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
    
    export default nextPWA;
  }
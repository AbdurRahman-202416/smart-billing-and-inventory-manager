import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // html5-qrcode uses browser-only APIs — exclude from server bundle
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals ?? []), "html5-qrcode"];
    }
    return config;
  },
  // Allow Next.js <Image /> to load product photos from Open Food Facts CDN
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.openfoodfacts.org",
      },
      {
        protocol: "https",
        hostname: "**.openfoodfacts.net",
      },
    ],
  },
};

export default nextConfig;

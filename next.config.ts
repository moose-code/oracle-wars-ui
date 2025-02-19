import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // This will ignore ESLint errors during build
  },
  images: {
    domains: ["d30nibem0g3f7u.cloudfront.net"], // Add the Envio logo domain
  },
};

export default nextConfig;

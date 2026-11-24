import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Resolve metadata (including missing slugs) before sending HTTP headers.
  htmlLimitedBots: /.*/,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: { localPatterns: [{ pathname: "/media/**", search: "" }] },
  serverExternalPackages: ["@prisma/client", "prisma"],
  outputFileTracingIncludes: {
    "/*": ["./assets/**/*", "./node_modules/.prisma/**/*", "./node_modules/@prisma/client/**/*"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  eslint: { ignoreDuringBuilds: true },
  webpack: (config, { dev }) => {
    if (!dev) config.parallelism = 1;
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;

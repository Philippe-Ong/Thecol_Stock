import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/Thecol_Stock',
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
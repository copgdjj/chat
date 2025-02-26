import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // 忽略构建时的所有 ESLint 错误
  },
  typescript: {
    ignoreBuildErrors: true, // 忽略 TypeScript 构建错误
  },
  output: 'standalone', // 优化 Docker 构建
};

export default nextConfig;

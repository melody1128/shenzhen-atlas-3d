import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 静态导出：适配 Cloudflare Pages 免费托管（0 元/月），无服务端运行时。
  output: "export",
  trailingSlash: false,
  images: { unoptimized: true },
};

export default nextConfig;

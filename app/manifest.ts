import type { MetadataRoute } from "next";

// 静态导出要求 metadata 路由为 force-static
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "深圳城市图鉴 3D",
    short_name: "深圳图鉴",
    description: "真实深圳 3D 城市探索与我的城市图鉴",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1416",
    theme_color: "#0b1416",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}

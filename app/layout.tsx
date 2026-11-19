import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "深圳城市图鉴 3D · Shenzhen Atlas",
  description: "以真实深圳地图、行政区划与城市地点数据为核心的本地 3D 城市探索平台。",
  applicationName: "深圳城市图鉴 3D",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  appleWebApp: { capable: true, title: "深圳图鉴 3D", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b1416" },
    { media: "(prefers-color-scheme: light)", color: "#eef3ef" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

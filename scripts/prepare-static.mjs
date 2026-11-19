import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * 静态导出前生成运行时地图配置 public/atlas-config.json。
 * - 本地：从 .env.local 读取。
 * - Cloudflare Pages：从构建环境变量读取（在 Dashboard 中配置，不入库）。
 * securityJsCode 仅在未配置 serviceHost（Worker 代理）时以官方支持的前端明文方式使用；
 * 项目文档中说明了该取舍，个人小流量站点可接受，介意时可改用 Cloudflare Worker 代理。
 */
function readLocalEnvFile() {
  const file = path.join(root, ".env.local");
  if (!existsSync(file)) return {};
  return Object.fromEntries(readFileSync(file, "utf8").split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return [];
    const index = trimmed.indexOf("=");
    if (index < 1) return [];
    return [[trimmed.slice(0, index), trimmed.slice(index + 1).replace(/^['"]|['"]$/g, "")]];
  }));
}

const local = readLocalEnvFile();
const config = {
  amapKey: (process.env.NEXT_PUBLIC_AMAP_KEY ?? local.NEXT_PUBLIC_AMAP_KEY ?? "").trim(),
  securityJsCode: (process.env.AMAP_SECURITY_CODE ?? local.AMAP_SECURITY_CODE ?? "").trim(),
  // 可选：Cloudflare Worker 代理地址（形如 https://xxx.workers.dev/_AMapService），配置后密钥不进前端包。
  serviceHost: (process.env.AMAP_SERVICE_HOST ?? local.AMAP_SERVICE_HOST ?? "").trim(),
  generatedAt: new Date().toISOString(),
};

writeFileSync(path.join(root, "public", "atlas-config.json"), JSON.stringify(config));
console.log(config.amapKey
  ? `地图配置已生成（key: ${config.amapKey.slice(0, 6)}…，密钥经 ${config.serviceHost ? "Worker 代理" : "前端明文（官方支持方式）"}）`
  : "警告：未配置 NEXT_PUBLIC_AMAP_KEY，站点将显示地图配置指引而不是假地图");

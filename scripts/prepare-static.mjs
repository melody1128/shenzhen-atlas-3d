import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
  serviceHost: (process.env.AMAP_SERVICE_HOST ?? local.AMAP_SERVICE_HOST ?? "").trim(),
};

writeFileSync(path.join(root, "public", "atlas-config.json"), JSON.stringify(config));
console.log(config.amapKey
  ? "地图配置已生成，高德安全密钥由服务端读取"
  : "警告：未配置 NEXT_PUBLIC_AMAP_KEY，站点将显示地图配置指引");

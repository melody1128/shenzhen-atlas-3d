import { spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { Readable } from "node:stream";
import { proxyAMap } from "../lib/map/amap-proxy.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "out");
const localDir = path.join(root, ".local");
const pidFile = path.join(localDir, "server.pid");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function readLocalEnv() {
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

function newestSourceTime(directory, latest = 0) {
  if (!existsSync(directory)) return latest;
  let newest = latest;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) newest = newestSourceTime(fullPath, newest);
    else newest = Math.max(newest, statSync(fullPath).mtimeMs);
  }
  return newest;
}

/** 静态站点是否需要重新构建（源代码或配置比 out/ 新，或 out/ 不存在）。 */
function needsBuild() {
  if (!existsSync(path.join(outDir, "index.html"))) return true;
  const buildTime = statSync(path.join(outDir, "index.html")).mtimeMs;
  const sourceTime = ["app", "components", "data", "lib", "types", "public"].reduce((latest, directory) => newestSourceTime(path.join(root, directory), latest), 0);
  const configTime = ["package.json", "package-lock.json", "tsconfig.json", "next.config.ts", ".env.local"].reduce((latest, file) => {
    const fullPath = path.join(root, file);
    return existsSync(fullPath) ? Math.max(latest, statSync(fullPath).mtimeMs) : latest;
  }, 0);
  return Math.max(sourceTime, configTime) > buildTime;
}

async function portAvailable(port) {
  return new Promise((resolve) => {
    const probe = createServer();
    probe.unref();
    probe.once("error", () => resolve(false));
    probe.listen(port, "0.0.0.0", () => probe.close(() => resolve(true)));
  });
}

async function findPort(preferred) {
  for (let port = preferred; port < preferred + 30; port += 1) {
    if (await portAvailable(port)) return port;
  }
  throw new Error("3000–3029 端口均不可用，请关闭占用程序后重试");
}

function runBuild() {
  const result = spawnSync("npm", ["run", "build"], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) throw new Error("生产构建失败，服务未启动");
}

function serveFile(filePath, response) {
  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, { "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream", "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=86400" });
  createReadStream(filePath).pipe(response);
}

const env = { ...process.env, ...readLocalEnv() };
const preferredPort = Number(env.PORT) || 3000;
const port = await findPort(preferredPort);
const lanAddress = Object.values(networkInterfaces()).flat().find((item) => item?.family === "IPv4" && !item.internal)?.address;
const lanUrl = lanAddress ? `http://${lanAddress}:${port}` : null;
mkdirSync(localDir, { recursive: true });

console.log("\n深圳城市图鉴 3D — 本地静态生产服务");
if (needsBuild()) {
  console.log("检测到源代码或地图配置变化，先执行生产构建…\n");
  runBuild();
}
if (!existsSync(path.join(outDir, "index.html"))) throw new Error("构建产物缺失：out/index.html 不存在");

console.log(`\n电脑访问：http://localhost:${port}`);
console.log(`手机访问：${lanUrl ?? "未检测到局域网 IPv4 地址"}`);
if (lanUrl) {
  console.log("请确保 iPhone 与电脑连接同一可互通的 Wi-Fi：\n");
  console.log(await QRCode.toString(lanUrl, { type: "terminal", small: true }));
  writeFileSync(path.join(localDir, "lan-qr.svg"), await QRCode.toString(lanUrl, { type: "svg", margin: 1 }));
}
writeFileSync(path.join(localDir, "access.json"), JSON.stringify({ localUrl: `http://localhost:${port}`, lanUrl, port }, null, 2));
console.log(`\n服务监听：0.0.0.0:${port}（仅限可信局域网，公网部署请见 README 的 Cloudflare Pages 章节）`);
console.log("停止方式：npm run local:stop 或 Ctrl+C\n");

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://localhost:${port}`);
    if (url.pathname.startsWith("/_AMapService/")) {
      const result = await proxyAMap(new Request(url, {
        method: request.method,
        headers: request.headers,
      }), {
        key: env.NEXT_PUBLIC_AMAP_KEY,
        securityCode: env.AMAP_SECURITY_CODE,
      });
      response.writeHead(result.status, Object.fromEntries(result.headers));
      if (result.body) Readable.fromWeb(result.body).on("error", () => response.destroy()).pipe(response);
      else response.end();
      return;
    }
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    const candidate = path.normalize(path.join(outDir, pathname));
    if (candidate.startsWith(outDir + path.sep) && existsSync(candidate) && statSync(candidate).isFile()) {
      serveFile(candidate, response);
      return;
    }
    const withHtml = `${candidate}.html`;
    if (candidate.startsWith(outDir + path.sep) && existsSync(withHtml) && statSync(withHtml).isFile()) {
      serveFile(withHtml, response);
      return;
    }
    // 单页应用回退：未命中文件时返回首页
    if (existsSync(path.join(outDir, "index.html"))) {
      serveFile(path.join(outDir, "index.html"), response);
      return;
    }
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("404 Not Found");
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("500 Internal Server Error");
  }
});

server.listen(port, "0.0.0.0", () => {
  writeFileSync(pidFile, JSON.stringify({ pid: process.pid, port, startedAt: new Date().toISOString() }));
});

const shutdown = () => {
  if (existsSync(pidFile)) rmSync(pidFile);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

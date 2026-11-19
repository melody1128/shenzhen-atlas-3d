import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pidFile = path.join(root, ".local", "server.pid");
if (!existsSync(pidFile)) {
  console.log("深圳城市图鉴当前没有由启动脚本运行的服务。");
  process.exit(0);
}

try {
  const { pid, port } = JSON.parse(readFileSync(pidFile, "utf8"));
  if (!Number.isInteger(pid)) throw new Error("无效的 PID 文件");

  // 尽量校验进程属于本项目；某些受限环境无法执行 ps 时降级为直接终止记录的 PID。
  try {
    const { execFileSync } = await import("node:child_process");
    const command = execFileSync("ps", ["-p", String(pid), "-o", "command="], { encoding: "utf8" }).trim();
    if (!command.includes("next") && !command.includes("start.mjs") && !command.includes("node")) {
      throw new Error("记录中的进程不属于本项目，已停止操作");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("不属于本项目")) throw error;
    console.log("无法通过 ps 校验进程（受限环境），将按记录 PID 直接停止。");
  }

  process.kill(pid, "SIGTERM");
  console.log(`已停止深圳城市图鉴服务（端口 ${port ?? "未知"}，PID ${pid}）。`);
} catch (error) {
  if (error?.code === "ESRCH") console.log("服务进程已经退出。");
  else console.error(`停止失败：${error instanceof Error ? error.message : String(error)}`);
} finally {
  rmSync(pidFile, { force: true });
}

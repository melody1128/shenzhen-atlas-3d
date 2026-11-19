# 深圳城市图鉴 3D

一个以真实深圳地图、官方行政区划和小区成交与村落房价参考为核心的静态 Web 项目。全部内容构建为纯静态站点（`out/`），可免费托管在 Cloudflare Pages（0 元/月），重点适配 iPhone Safari。

项目不是静态截图演示：行政区划、社区名录、房价快照是经核实来源的静态数据；地图、POI、周边查询由高德官方在线服务按需检索。没有可靠来源的数据一律显示缺失，不会编造。

## 已实现功能

- Next.js 16 + React 19 + TypeScript 严格模式，纯静态导出（`output: "export"`）。
- 高德 JavaScript API 2.0 真实深圳底图接入层（Key 未配置时显示配置指引，绝不显示假地图）。
- 3D / 2D 切换、倾斜、旋转、缩放、回正北、恢复全市视角；标准 / 卫星 / 夜间模式。
- 官方行政区划：9 个行政区 + 大鹏新区功能区 + 74 个街道（深圳市民政局 2026-05-06 目录）。
- 783 个社区居委会名录（国家统计局统计用区划代码，覆盖 74/74 街道），街道详情内可逐级浏览社区。
- 区级真实边界（高德 DistrictSearch 在线查询），选区高亮、镜头飞行。
- 街道/社区/地点定位：优先检索真实街道办、居委会或 POI；无可靠边界时明确标注"精确边界数据暂缺"，绝不绘制示意假边界。
- 全局搜索：区、街道、社区名、商圈、商场、城中村线索 + 高德远程 POI 检索。
- 只给当前视野中的商场、城中村、小区、写字楼、总部、银行、政务设施、幼儿园和车站等主要地点加分类图标。标准模式使用浅色高德 3D 楼块，卫星模式直接呈现影像。
- 地点详情：行政层级面包屑、地址、坐标（GCJ-02）、来源、周边 1.5 公里按需查询（球面直线距离）。
- 小区详情展示最近一笔收录的公开成交总价、面积、日期及折算单价。城中村有可核实的平台参考均价时，单独标注来源、月份和口径。
- 手机端「地铁」打开高德深圳全市地铁线网，点站名可跳到经核实的出入口或站点。
- 探索图鉴：已浏览、已了解、收藏、想去、最近浏览，浏览器本地持久化，进度分母只使用官方目录（10 区 / 74 街道）。
- 桌面三栏布局；移动端全屏地图、底部导航、半屏/展开详情抽屉、iPhone Safe Area 适配。
- PWA 基础：manifest、主题色、图标，可添加到 iPhone 主屏幕。
- 一键本地启动（自动构建、端口检测、局域网地址、终端二维码）。

## 快速开始

```bash
npm ci
npm run build        # 生成静态站点到 out/（自动生成地图配置）
npm run local:start  # 本地静态服务，输出电脑/手机地址与二维码
```

本地验证过的地址：电脑 `http://localhost:3000`，手机（同一 Wi-Fi）`http://<本机IP>:3000`。

## 高德 Key 配置（唯一外部依赖）

1. 打开 [高德开放平台控制台](https://console.amap.com/dev/key/app)。
2. 创建应用 → 添加 Key，类型选择 **Web端(JS API)**，同时取得配套安全密钥。
3. 配置环境变量：
   - **本地**：`cp .env.example .env.local`，填入 `NEXT_PUBLIC_AMAP_KEY` 与 `AMAP_SECURITY_CODE`，重新 `npm run build`。
   - **Cloudflare Pages**：将 `NEXT_PUBLIC_AMAP_KEY` 配置为项目环境变量，将 `AMAP_SECURITY_CODE` 配置为加密 Secret，重新部署。
4. 重新构建后地图即加载真实深圳底图、建筑楼块与全部 POI 图层。

浏览器使用高德 Web Key 加载 JS API。本地服务和 Cloudflare Pages Function 通过同源 `/_AMapService/` 转发地图服务请求，并在服务端附加安全密钥。客户端配置文件只包含 Web Key 和可选代理地址。

## 部署到 Cloudflare Pages（Git 自动构建）

1. 将项目推送到 GitHub。
2. 在 Cloudflare Workers & Pages 创建 Pages 项目，选择导入现有 Git 仓库。
3. 生产分支选择 `main`，框架选择 `Next.js (Static HTML Export)`，构建命令填 `npm run build`，产物目录填 `out`。构建变量 `NODE_VERSION` 设为 `24.16.0`。
4. 将 `NEXT_PUBLIC_AMAP_KEY` 添加为生产环境变量，用于构建和运行时。将配套的 `AMAP_SECURITY_CODE` 添加为生产环境的 **Secret**。保存后部署。
5. 从项目部署详情打开分配的 `pages.dev` 地址，检查底图、区级边界和地点搜索。

## 常用命令

```bash
npm run typecheck   # TypeScript 严格模式检查
npm run lint        # ESLint
npm test            # 区划、社区、搜索、地点分类与房价测试
npm run build       # 静态导出到 out/
npm run local:start # 本地静态服务（自动构建+二维码）
npm run local:stop  # 停止本地服务
```

macOS 双击脚本：`启动深圳图鉴.command` / `停止深圳图鉴.command`。

## 数据来源与真实性边界

| 数据 | 来源 | 状态 |
| --- | --- | --- |
| 区/街道目录（10+74） | 深圳市民政局 2026-05-06 | 完整，单元测试核对 |
| 社区名录（783 个） | 国家统计局统计用区划代码（2023 年口径，modood 仓库整理） | 覆盖 74/74 街道，标注统计年份 |
| 区级边界 | 高德 DistrictSearch 在线查询 | 运行时加载，未返回时明确缺失 |
| 街道/社区边界 | 暂无可批量核验公开数据 | 明确标注缺失，不画示意边界 |
| POI / 周边 | 高德 PlaceSearch 在线检索 | 按需检索，非完整目录 |
| 房价 | 深圳中原地产的公开成交记录、58同城爱房的村落参考均价 | 精确匹配地点，显示成交日期或统计月份与来源链接 |
| 地铁线网及出口 | 高德地铁图 JS API、PlaceSearch | 在线线网图，点站回到实际地图 |
| 地图底图/建筑/卫星 | 高德 JS API 2.0 在线加载 | 遵守官方加载机制与版权 |

详见 [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) 与 [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md)。

## 技术架构

```text
app/            页面、manifest、全局样式（静态导出）
components/     AtlasApp 主界面、地图视图、详情面板、图鉴、发现面板
data/           官方区划目录、社区名录、图层定义、房价快照、地点线索
lib/map/        高德加载器与服务适配层（业务只接触统一 AtlasPlace 模型）
lib/search/     本地目录搜索
lib/store/      浏览器本地探索记录（localStorage）
scripts/        静态配置生成、社区提取、本地启动/停止
tests/          11 项单元测试
out/            构建产物（Cloudflare Pages 直接托管此目录）
```

## 合规提示

高德 JS API 仅允许在线加载，不得离线保存、混编或绕过版权、审图号与配额限制。房价与区划数据仅按来源许可用于展示，不再分发原始数据集。公开发布前请复核高德服务条款与域名白名单设置。

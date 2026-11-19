# 深圳城市图鉴 3D

一个以真实深圳地图、官方行政区划和真实成交房价快照为核心的静态 Web 项目。全部内容构建为纯静态站点（`out/`），可免费托管在 Cloudflare Pages（0 元/月），重点适配 iPhone Safari。

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
- 商圈、购物中心、城中村、住宅小区、地铁站、铁路、派出所、政务设施、学校、医院、公园等按需图层（按选区+缩放层级检索，带数量提示）。
- 地点详情：行政层级面包屑、地址、坐标（GCJ-02）、来源、周边 1.5 公里按需查询（球面直线距离）。
- 房价静态快照（2026-11-18 采集）：全市 2026-10 成交均价约 5.64 万/㎡（乐有家/贝壳，市政府官网转载）+ 10 个区 + 16 个重点板块成交价（普睿数智 2026-10）；每条含统计时间、样本量、来源；小区级明确显示"暂无可靠成交数据"。
- 探索图鉴：已浏览、已了解、收藏、想去、最近浏览，浏览器本地持久化，进度分母只使用官方目录（10 区 / 74 街道）。
- 桌面三栏布局；移动端全屏地图、底部导航、半屏/展开详情抽屉、iPhone Safe Area 适配。
- PWA 基础：manifest、主题色、图标，可添加到 iPhone 主屏幕。
- 一键本地启动（自动构建、端口检测、局域网地址、终端二维码）。

## 快速开始

```bash
npm install
npm run build        # 生成静态站点到 out/（自动生成地图配置）
npm run local:start  # 本地静态服务，输出电脑/手机地址与二维码
```

本地验证过的地址：电脑 `http://localhost:3000`，手机（同一 Wi-Fi）`http://<本机IP>:3000`。

## 高德 Key 配置（唯一外部依赖）

1. 打开 [高德开放平台控制台](https://console.amap.com/dev/key/app)。
2. 创建应用 → 添加 Key，类型选择 **Web端(JS API)**，同时取得配套安全密钥。
3. 配置环境变量：
   - **本地**：`cp .env.example .env.local`，填入 `NEXT_PUBLIC_AMAP_KEY` 与 `AMAP_SECURITY_CODE`，重新 `npm run build`。
   - **Cloudflare Pages**：在项目 Settings → Environment variables 中配置同名变量，重新部署。
4. 重新构建后地图即加载真实深圳底图、建筑楼块与全部 POI 图层。

安全说明：默认使用高德官方支持的前端安全密钥配置方式（适合个人小流量站点）。如需密钥完全不进前端，可部署 Cloudflare Worker 代理并设置 `AMAP_SERVICE_HOST`（免费额度内）。密钥均通过构建注入，不写入代码仓库。

## 部署到 Cloudflare Pages（公网 HTTPS，0 元/月）

方式一：Git 连接（推荐，自动构建）

1. 把本项目推送到 GitHub 仓库。
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → 连接该仓库。
3. 构建配置：
   - Framework preset: `Next.js (Static HTML Export)`
   - Build command: `npm run build`
   - Build output directory: `out`
4. 在 Settings → Environment variables 配置 `NEXT_PUBLIC_AMAP_KEY`、`AMAP_SECURITY_CODE`。
5. 部署完成后获得 `https://<项目名>.pages.dev` 公网地址。

方式二：Direct Upload（无需 Git）

```bash
npm run build
npx wrangler pages deploy out --project-name=shenzhen-atlas-3d
# 首次会要求 wrangler login 授权 Cloudflare 账号
```

> 本机已验证 `wrangler 4.164.0` 可用，但部署需要你本人登录 Cloudflare 授权，因此未代替执行，也绝不伪造部署结果。

## 常用命令

```bash
npm run typecheck   # TypeScript 严格模式检查
npm run lint        # ESLint
npm test            # 11 项单元测试（区划/社区/搜索/房价）
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
| 房价 | 乐有家/贝壳（全市）、普睿数智（区/板块） | 静态快照 2026-11-18，每条含来源/时间 |
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

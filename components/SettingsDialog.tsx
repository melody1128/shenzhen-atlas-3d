"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Copy, Globe, KeyRound, QrCode, Share, X } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  mapReady: boolean;
}

/**
 * 设置面板：静态部署后不再依赖局域网地址，改为展示当前站点地址、
 * 分享二维码、高德 Key 配置指引与公开部署说明。
 */
export function SettingsDialog({ open, onClose, mapReady }: SettingsDialogProps) {
  const [origin, setOrigin] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 首次打开时读取地址并生成二维码（外部系统副作用）
  useEffect(() => {
    if (!open || origin) return;
    const current = window.location.origin;
    void import("qrcode")
      .then((module) => module.toDataURL(current, { margin: 1, width: 260, color: { dark: "#102326", light: "#e9fff9" } }))
      .then((dataUrl) => { setOrigin(current); setQrCode(dataUrl); });
  }, [open, origin]);

  if (!open) return null;
  const copyAddress = async () => {
    await navigator.clipboard.writeText(origin);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="dialog-header">
          <div><span className="eyebrow">SHENZHEN ATLAS</span><h2 id="settings-title">访问与地图配置</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭设置"><X size={19} /></button>
        </div>
        <div className="dialog-content">
          <section className="network-section">
            <div className="network-copy">
              <h3><Globe size={17} />当前站点</h3>
              <p>这是静态托管的公网站点，收藏网址或添加到 iPhone 主屏幕即可随时访问。</p>
              <div className="lan-address"><code>{origin || "…"}</code><button type="button" onClick={() => void copyAddress()} aria-label="复制站点地址"><Copy size={15} /></button></div>
              <small>{copied ? "已复制" : "通过 Safari 分享菜单可“添加到主屏幕”。"}</small>
              <div className="computer-address"><Share size={14} /><span>无需登录，收藏与探索记录保存在本机浏览器</span></div>
            </div>
            <div className="qr-card">{qrCode ? <Image src={qrCode} alt="站点二维码" width={260} height={260} unoptimized /> : <QrCode size={64} />}<span>扫码在手机打开</span></div>
          </section>
          <section className="key-section">
            <h3><KeyRound size={17} />高德地图 Key</h3>
            <div className="config-status"><span className={mapReady ? "status-dot online" : "status-dot"} />{mapReady ? "真实地图已连接" : "当前尚未完成地图连接"}</div>
            <ol>
              <li>打开 <a href="https://console.amap.com/dev/key/app" target="_blank" rel="noreferrer">高德开放平台控制台</a>，创建应用。</li>
              <li>添加 Key，类型选择 <strong>Web端(JS API)</strong>，同时取得配套安全密钥。</li>
              <li>在 Cloudflare Pages 项目设置 → Environment variables 中配置：
                <pre>NEXT_PUBLIC_AMAP_KEY=你的Key{`\n`}AMAP_SECURITY_CODE=你的安全密钥</pre>
              </li>
              <li>重新部署一次即可生效；密钥不进入代码仓库。</li>
            </ol>
            <p className="security-note">默认采用高德官方支持的前端安全密钥配置方式，适合个人小流量站点；如需密钥完全不进前端，可另行部署 Cloudflare Worker 代理并设置 AMAP_SERVICE_HOST。Key 额度与域名白名单以高德控制台和服务条款为准。</p>
          </section>
        </div>
      </section>
    </div>
  );
}

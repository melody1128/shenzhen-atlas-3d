"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, LoaderCircle, TrainFront, X } from "lucide-react";

const WESTERN_STATIONS = ["机场东", "后瑞", "固戍", "西乡", "坪洲", "宝体", "宝安中心", "新安"];

interface Props {
  onClose: () => void;
  onStation: (name: string) => Promise<boolean>;
}

export function MetroDialog({ onClose, onStation }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const requestRef = useRef(0);
  const onStationRef = useRef(onStation);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { onStationRef.current = onStation; }, [onStation]);

  const select = async (station: string) => {
    const request = ++requestRef.current;
    const name = station.replace(/(?:地铁)?站$/, "");
    setPending(name);
    setMessage("");
    const found = await onStationRef.current(name).catch(() => false);
    if (request !== requestRef.current) return;
    setPending("");
    if (!found) setMessage(`暂时无法定位${name}站，请稍后再试。`);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow || event.data?.type !== "atlas:metro") return;
      if (event.data.status === "ready" || event.data.status === "error") setState(event.data.status);
      if (typeof event.data.station === "string" && event.data.station.length <= 40) void select(event.data.station);
    };
    window.addEventListener("message", receive);
    return () => {
      requestRef.current += 1;
      dialog?.close();
      window.removeEventListener("message", receive);
    };
  }, []);

  return (
    <dialog className="metro-dialog" ref={dialogRef} aria-labelledby="metro-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <header className="metro-heading">
        <div><TrainFront size={19} /><h2 id="metro-title">深圳地铁线路图</h2></div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="关闭地铁线路图"><X size={18} /></button>
      </header>
      <p className="metro-instruction">点站名查看站点附近。地图会优先定位一个出入口。</p>
      <div className="metro-frame-wrap">
        <iframe ref={frame} src="/metro.html" title="高德深圳地铁线网图" />
        {state !== "ready" && <p className="metro-frame-status" role="status">{state === "loading" ? "正在加载全市地铁线网…" : "全市线网暂不可用，可以直接点下方1号线的站名。"}</p>}
      </div>
      <div className="metro-line">
        <strong>1号线 · 西段</strong>
        <div className="metro-stations" aria-label="1号线西段站点">
          {WESTERN_STATIONS.map((name) => (
            <button type="button" key={name} onClick={() => void select(name)} aria-label={`${name}站`}>
              <span aria-hidden="true" />{name}
            </button>
          ))}
        </div>
      </div>
      {pending && <p className="metro-feedback" role="status"><LoaderCircle size={15} className="spin" />正在查找{pending}站出入口…</p>}
      {message && <p className="metro-feedback" role="status">{message}</p>}
      <a className="metro-source" href="https://www.szmc.net/map/" target="_blank" rel="noreferrer">深圳地铁官方线网 <ExternalLink size={12} /></a>
    </dialog>
  );
}

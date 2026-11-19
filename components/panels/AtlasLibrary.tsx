"use client";

import { Bookmark, Check, Clock3, Flag, MapPin } from "lucide-react";
import { ALL_STREETS, DISTRICTS } from "@/data/districts";
import { useAtlasStore } from "@/lib/store/atlas-store";
import type { ExplorationRecord } from "@/types/atlas";

interface AtlasLibraryProps {
  onOpenRecord: (id: string, record: ExplorationRecord) => void;
}

export function AtlasLibrary({ onOpenRecord }: AtlasLibraryProps) {
  const records = useAtlasStore((state) => state.records);
  const entries = Object.entries(records);
  const favorites = entries.filter(([, record]) => record.favorite);
  const wishlist = entries.filter(([, record]) => record.wishlist);
  const recent = [...entries].sort((a, b) => b[1].viewedAt.localeCompare(a[1].viewedAt));
  const knownStreets = ALL_STREETS.filter((street) => records[street.id]?.status === "已了解").length;
  const knownDistricts = DISTRICTS.filter((district) => records[district.id]?.status === "已了解").length;

  const renderRecord = ([id, record]: [string, ExplorationRecord]) => (
    <button className="library-record" type="button" key={id} onClick={() => onOpenRecord(id, record)}>
      <span className="record-symbol"><MapPin size={16} /></span>
      <span><strong>{record.name}</strong><small>{record.districtName || "深圳"} · {record.category}</small></span>
      <span className="record-state">{record.status === "已了解" ? <Check size={13} /> : record.favorite ? <Bookmark size={13} /> : <Clock3 size={13} />}{record.status}</span>
    </button>
  );

  return (
    <div className="atlas-library">
      <div className="panel-section-heading"><div><span className="eyebrow">MY CITY ATLAS</span><h2>我的城市图鉴</h2></div><Bookmark size={19} /></div>
      <p className="panel-intro">记录仅保存在当前浏览器。分母只使用已核实的 10 个区/新区与 74 个街道，不计算不完整 POI 的“全市百分比”。</p>
      <div className="progress-cards">
        <div><span>已了解区 / 新区</span><strong>{knownDistricts}<small> / 10</small></strong><div className="progress-line"><span style={{ width: `${knownDistricts * 10}%` }} /></div></div>
        <div><span>已了解街道</span><strong>{knownStreets}<small> / 74</small></strong><div className="progress-line"><span style={{ width: `${(knownStreets / 74) * 100}%` }} /></div></div>
      </div>
      <div className="library-stats"><span><Bookmark size={14} />{favorites.length} 个收藏</span><span><Flag size={14} />{wishlist.length} 个想去</span><span><Clock3 size={14} />{entries.length} 次记录</span></div>
      <section className="library-section"><h3>我的收藏</h3>{favorites.length ? favorites.map(renderRecord) : <div className="library-empty"><Bookmark size={22} /><p>还没有收藏地点</p><small>在地点详情中点“收藏”，建立自己的深圳图鉴。</small></div>}</section>
      <section className="library-section"><h3>想去实地看看</h3>{wishlist.length ? wishlist.map(renderRecord) : <p className="empty-copy">暂无想去地点</p>}</section>
      <section className="library-section"><h3>最近浏览</h3>{recent.length ? recent.slice(0, 12).map(renderRecord) : <p className="empty-copy">浏览地点后会出现在这里</p>}</section>
    </div>
  );
}

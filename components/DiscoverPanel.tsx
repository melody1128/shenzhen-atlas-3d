"use client";

import { ArrowUpRight, Compass, MapPin } from "lucide-react";
import { CURATED_PLACES } from "@/data/places";
import { DISTRICT_BY_ID } from "@/data/districts";
import { cityPriceSeries, districtPriceOverview, formatPrice, PRICE_SNAPSHOT_DATE } from "@/data/prices";
import type { CuratedPlace } from "@/types/atlas";

const PRIORITY_IDS = ["biz-fanshen", "biz-baoan-center", "biz-houhai", "biz-kejiyuan", "mall-yifangcheng", "village-gushu", "mall-mixc-world", "mall-sz-bay-mixc"];

export function dailyRecommendation(): CuratedPlace {
  const date = new Date().toISOString().slice(0, 10);
  const score = Array.from(date).reduce((total, character) => total + character.charCodeAt(0), 0);
  return CURATED_PLACES[score % CURATED_PLACES.length] ?? CURATED_PLACES[0]!;
}

export function DiscoverPanel({ onSelect, onSelectDistrict }: { onSelect: (place: CuratedPlace) => void; onSelectDistrict: (districtId: string) => void }) {
  const recommendation = dailyRecommendation();
  const priority = PRIORITY_IDS.map((id) => CURATED_PLACES.find((place) => place.id === id)).filter((place): place is CuratedPlace => Boolean(place));
  return (
    <div className="discover-panel">
      <div className="panel-section-heading"><div><span className="eyebrow">CITY FIELD NOTES</span><h2>发现深圳</h2></div><Compass size={20} /></div>
      <button className="daily-card" type="button" onClick={() => onSelect(recommendation)}>
        <span className="eyebrow">今天探索一个地方</span>
        <strong>{recommendation.name}</strong>
        <span>{DISTRICT_BY_ID.get(recommendation.districtId)?.name} · {recommendation.category}</span>
        <div>打开真实地点检索 <ArrowUpRight size={16} /></div>
      </button>
      <section className="priority-section"><h3>二手成交均价速览</h3>
        <div className="city-price-card">
          <span>深圳全市 · 网签成交口径</span>
          <strong>{formatPrice(cityPriceSeries()[cityPriceSeries().length - 1]?.price)}</strong>
          <small>统计 2026-10 · 4361 套 · 乐有家/贝壳研究院（市政府官网转载）</small>
        </div>
        <div className="district-price-grid">
          {districtPriceOverview().map((entry) => (
            <button type="button" key={entry.targetId} onClick={() => onSelectDistrict(entry.targetId)}>
              <span>{entry.targetName}</span>
              <strong>{formatPrice(entry.price)}</strong>
            </button>
          ))}
        </div>
        <p>静态快照采集于 {PRICE_SNAPSHOT_DATE}，来源与口径见数据源说明；区级来自普睿数智 2026-10 月报。小区级暂无可靠成交数据。</p>
      </section>
      <section className="priority-section"><h3>优先体验区域</h3><p>宝安中心、翻身、西乡与南山后海、科技园、深圳湾。此处是真实地名线索，不是完整区域排行。</p></section>
      <div className="discovery-grid">
        {priority.map((place, index) => (
          <button type="button" key={place.id} onClick={() => onSelect(place)}>
            <span>{String(index + 1).padStart(2, "0")}</span><MapPin size={15} />
            <strong>{place.name}</strong><small>{place.areaName ?? DISTRICT_BY_ID.get(place.districtId)?.name} · {place.category}</small>
          </button>
        ))}
      </div>
      <div className="coverage-note"><Compass size={15} /><span>推荐来自项目内已录入的真实地名目录<br /><small>不使用 AI 临时编造地点</small></span></div>
    </div>
  );
}

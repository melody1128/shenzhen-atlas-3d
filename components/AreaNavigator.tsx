"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, MapPinned } from "lucide-react";
import { DISTRICTS, DISTRICT_BY_ID } from "@/data/districts";
import { communitiesOfStreet } from "@/data/communities";
import type { District, Street } from "@/types/atlas";

interface AreaNavigatorProps {
  selectedDistrictId: string | null;
  selectedStreetId?: string;
  onDistrictSelect: (district: District) => void;
  onStreetSelect: (district: District, street: Street) => void;
}

export function AreaNavigator({ selectedDistrictId, selectedStreetId, onDistrictSelect, onStreetSelect }: AreaNavigatorProps) {
  const [expandedId, setExpandedId] = useState<string>(selectedDistrictId ?? "baoan");
  const expandedDistrict = DISTRICT_BY_ID.get(expandedId);

  return (
    <div className="area-navigator">
      <div className="panel-section-heading">
        <div><span className="eyebrow">ADMINISTRATIVE INDEX</span><h2>深圳区域目录</h2></div>
        <span className="count-badge">74 街道</span>
      </div>
      <div className="coverage-note"><MapPinned size={15} /><span>9 个行政区 + 1 个功能区<br /><small>官方目录更新至 2026-05-06</small></span></div>
      <div className="district-list">
        {DISTRICTS.map((district) => {
          const expanded = expandedId === district.id;
          const selected = selectedDistrictId === district.id;
          return (
            <div className={`district-group ${selected ? "selected" : ""}`} key={district.id}>
              <div className="district-row">
                <button
                  type="button"
                  className="district-main-button"
                  onClick={() => { setExpandedId(district.id); onDistrictSelect(district); }}
                  aria-current={selected ? "true" : undefined}
                >
                  <span className="district-color" style={{ backgroundColor: district.color }} />
                  <span><strong>{district.name}</strong><small>{district.kind} · {district.streets.length} 个街道</small></span>
                </button>
                <button
                  type="button"
                  className="district-expand-button"
                  aria-label={`${expanded ? "收起" : "展开"}${district.name}`}
                  onClick={() => setExpandedId(expanded ? "" : district.id)}
                >
                  {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>
              </div>
              {expanded && (
                <div className="street-list">
                  {district.streets.map((street) => {
                    const count = communitiesOfStreet(street.name)?.length ?? 0;
                    return (
                      <button
                        type="button"
                        key={street.id}
                        className={selectedStreetId === street.id ? "active" : ""}
                        onClick={() => onStreetSelect(district, street)}
                      >
                        <span>{street.name}</span>
                        <small>{count ? `${count} 社区` : "边界暂缺"}</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {expandedDistrict?.id === "dapeng" && <p className="legal-note">大鹏新区是功能区，本目录不会将其与 9 个法定行政区混同。</p>}
      <a className="source-link" href={DISTRICTS[0]?.source.url} target="_blank" rel="noreferrer">
        查看深圳市民政局来源 <ExternalLink size={13} />
      </a>
    </div>
  );
}

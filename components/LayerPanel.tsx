"use client";

import { Building2, CircleDollarSign, Hospital, House, Landmark, Layers3, Map, School, ShieldCheck, ShoppingBag, Store, TrainFront, Trees } from "lucide-react";
import { LAYER_DEFINITIONS } from "@/data/layers";
import type { LayerId } from "@/types/atlas";

const ICONS: Partial<Record<LayerId, typeof Map>> = {
  districts: Map,
  business: Store,
  malls: ShoppingBag,
  villages: House,
  residential: Building2,
  metro: TrainFront,
  railway: TrainFront,
  police: ShieldCheck,
  government: Landmark,
  schools: School,
  hospitals: Hospital,
  parks: Trees,
  prices: CircleDollarSign,
  buildings: Building2,
};

interface LayerPanelProps {
  layers: Record<LayerId, boolean>;
  counts: Partial<Record<LayerId, number>>;
  mapReady: boolean;
  onToggle: (layerId: LayerId) => void;
}

export function LayerPanel({ layers, counts, mapReady, onToggle }: LayerPanelProps) {
  return (
    <div className="layer-panel">
      <div className="panel-section-heading">
        <div><span className="eyebrow">MAP LAYERS</span><h2>城市图层</h2></div>
        <Layers3 size={19} />
      </div>
      <p className="panel-intro">按当前选区检索并分层显示。地图服务分页结果不等于全市完整目录。</p>
      <div className="layer-list">
        {LAYER_DEFINITIONS.map((layer) => {
          const Icon = ICONS[layer.id] ?? Map;
          const count = counts[layer.id];
          return (
            <div className={`layer-item ${layers[layer.id] ? "enabled" : ""}`} key={layer.id}>
              <button type="button" onClick={() => onToggle(layer.id)} aria-pressed={layers[layer.id]} disabled={!mapReady && !["prices"].includes(layer.id)}>
                <span className="layer-icon"><Icon size={16} /></span>
                <span className="layer-copy"><strong>{layer.label}</strong><small>{layer.description}</small></span>
                <span className="switch-track"><span /></span>
              </button>
              {layers[layer.id] && count === -1 && <div className="layer-footnote">请放大地图至 {layer.minZoom} 级后加载</div>}
              {layers[layer.id] && typeof count === "number" && count > 0 && <div className="layer-footnote">当前显示 {count} 个检索结果</div>}
              {layers[layer.id] && count === 0 && layer.keyword && <div className="layer-footnote">当前范围未返回结果</div>}
              {layers[layer.id] && layer.id === "prices" && <div className="layer-footnote warning">暂无可靠成交数据，不生成价格热力图</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

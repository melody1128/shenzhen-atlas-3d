"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { AlertTriangle, KeyRound, LoaderCircle } from "lucide-react";
import { LAYER_DEFINITIONS } from "@/data/layers";
import { DISTRICT_BY_ID } from "@/data/districts";
import { ShenzhenMapService, type BaseMapMode } from "@/lib/map/amap-service";
import type { AtlasPlace, CuratedPlace, District, LayerId, NearbyPlace, PlaceCategory, Street } from "@/types/atlas";

export interface MapHandle {
  focusDistrict: (districtId: string) => boolean;
  focusStreet: (district: District, street: Street) => Promise<AtlasPlace | null>;
  focusCurated: (curated: CuratedPlace) => Promise<AtlasPlace | null>;
  focusPlace: (place: AtlasPlace) => void;
  searchGlobal: (keyword: string) => Promise<AtlasPlace[]>;
  searchNearby: (origin: AtlasPlace, keyword: string, category: PlaceCategory) => Promise<NearbyPlace[]>;
  resetNorth: () => void;
  resetView: () => void;
}

interface AMapViewProps {
  layers: Record<LayerId, boolean>;
  mapMode: BaseMapMode;
  viewMode: "2D" | "3D";
  theme: "dark" | "light";
  selectedDistrictId: string | null;
  onDistrictSelect: (districtId: string) => void;
  onPlaceSelect: (place: AtlasPlace) => void;
  onReadyChange: (ready: boolean) => void;
  onError: (message: string) => void;
  onLayerCount: (layerId: LayerId, count: number) => void;
}

function friendlyMapError(error: unknown): string {
  const message = error instanceof Error ? error.message : "地图初始化失败";
  if (message === "MISSING_AMAP_KEY") return "尚未配置高德 Web 端 Key（NEXT_PUBLIC_AMAP_KEY）。按「设置」中的说明在 Cloudflare Pages 环境变量或本地 .env.local 配置后重新构建，本站不会用假地图代替。";
  if (message.includes("地图配置文件缺失")) return "atlas-config.json 未生成。请先运行 npm run build（构建会自动生成地图配置）。";
  return message;
}

export const AMapView = forwardRef<MapHandle, AMapViewProps>(function AMapView(props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<ShenzhenMapService | null>(null);
  const callbacksRef = useRef(props);
  callbacksRef.current = props;
  const { layers: activeLayers, selectedDistrictId: activeDistrictId } = props;
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boundarySummary, setBoundarySummary] = useState<string>("");
  const [zoom, setZoom] = useState(10.2);

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    ShenzhenMapService.create(containerRef.current, (place) => callbacksRef.current.onPlaceSelect(place))
      .then(async (service) => {
        if (disposed) {
          service.destroy();
          return;
        }
        serviceRef.current = service;
        service.onZoomChange(() => setZoom(service.getZoom()));
        setReady(true);
        setLoading(false);
        callbacksRef.current.onReadyChange(true);
        const summary = await service.loadDistrictBoundaries(callbacksRef.current.onDistrictSelect);
        if (!disposed) {
          setBoundarySummary(summary.unavailable.length
            ? `已加载 ${summary.loaded} 个区边界；${summary.unavailable.join("、")}暂不可用`
            : `已加载 ${summary.loaded} 个区真实边界`);
        }
      })
      .catch((reason: unknown) => {
        if (disposed) return;
        const message = friendlyMapError(reason);
        setError(message);
        setLoading(false);
        callbacksRef.current.onReadyChange(false);
      });
    return () => {
      disposed = true;
      serviceRef.current?.destroy();
      serviceRef.current = null;
    };
  }, []);

  useEffect(() => { serviceRef.current?.setBaseMode(props.mapMode, props.theme); }, [props.mapMode, props.theme, ready]);
  useEffect(() => { serviceRef.current?.setViewMode(props.viewMode); }, [props.viewMode, ready]);
  useEffect(() => { serviceRef.current?.setBuildingsVisible(props.layers.buildings); }, [props.layers.buildings, ready]);
  useEffect(() => { serviceRef.current?.setDistrictBoundariesVisible(props.layers.districts); }, [props.layers.districts, ready, boundarySummary]);
  useEffect(() => { serviceRef.current?.highlightDistrict(props.selectedDistrictId); }, [props.selectedDistrictId, ready, boundarySummary]);

  useEffect(() => {
    const service = serviceRef.current;
    if (!service || !ready) return;
    const districtName = activeDistrictId ? DISTRICT_BY_ID.get(activeDistrictId)?.name : undefined;
    for (const definition of LAYER_DEFINITIONS) {
      if (!definition.keyword || !definition.category) continue;
      if (!activeLayers[definition.id]) {
        service.clearLayer(definition.id);
        callbacksRef.current.onLayerCount(definition.id, 0);
        continue;
      }
      if (zoom < definition.minZoom) {
        service.clearLayer(definition.id);
        callbacksRef.current.onLayerCount(definition.id, -1);
        continue;
      }
      service.syncPlaceLayer(definition.id, definition.keyword, definition.category, districtName)
        .then((count) => callbacksRef.current.onLayerCount(definition.id, count))
        .catch((reason: unknown) => {
          callbacksRef.current.onLayerCount(definition.id, 0);
          callbacksRef.current.onError(reason instanceof Error ? reason.message : `${definition.label}图层加载失败`);
        });
    }
    // 图层定义是静态常量；缩放与选区变化会按视口层级重新检索。
  }, [activeLayers, activeDistrictId, ready, zoom]);

  useImperativeHandle(ref, () => ({
    focusDistrict: (districtId) => serviceRef.current?.flyToDistrict(districtId) ?? false,
    focusStreet: async (district, street) => {
      const place = await serviceRef.current?.locateStreet(district, street) ?? null;
      if (place) serviceRef.current?.flyToPlace(place);
      return place;
    },
    focusCurated: async (curated) => {
      const place = await serviceRef.current?.locateCurated(curated) ?? null;
      if (place) serviceRef.current?.flyToPlace(place);
      return place;
    },
    focusPlace: (place) => serviceRef.current?.flyToPlace(place),
    searchGlobal: (keyword) => serviceRef.current?.searchGlobal(keyword) ?? Promise.reject(new Error("真实地图尚未连接")),
    searchNearby: (origin, keyword, category) => serviceRef.current?.searchNearby(origin, keyword, category) ?? Promise.reject(new Error("真实地图尚未连接")),
    resetNorth: () => serviceRef.current?.resetNorth(),
    resetView: () => serviceRef.current?.resetView(),
  }), []);

  return (
    <div className="map-stage">
      <div ref={containerRef} className="amap-container" aria-label="深圳真实交互地图" />
      {loading && (
        <div className="map-state-card" role="status">
          <LoaderCircle className="spin" size={22} />
          <div><strong>正在连接深圳</strong><span>加载真实底图、行政边界与城市楼块</span></div>
        </div>
      )}
      {error && (
        <div className="map-state-card map-config-card" role="alert">
          <div className="map-state-icon">{error.includes("Key") || error.includes("密钥") ? <KeyRound size={24} /> : <AlertTriangle size={24} />}</div>
          <div>
            <span className="eyebrow">MAP CONNECTION</span>
            <h2>真实地图尚未连接</h2>
            <p>{error}</p>
            <div className="config-path"><code>NEXT_PUBLIC_AMAP_KEY / AMAP_SECURITY_CODE</code><span>本地放 .env.local；公网部署在 Cloudflare Pages 环境变量中配置</span></div>
            <small>仍可浏览 74 个街道官方目录、本地搜索与我的图鉴；此处不使用假地图代替。</small>
          </div>
        </div>
      )}
      {!error && (
        <div className="map-data-note">
          <span className={ready ? "status-dot online" : "status-dot"} />
          {ready ? "高德真实地图 · GCJ-02" : "地图连接中"}
          {boundarySummary && <span className="boundary-summary"> · {boundarySummary}</span>}
        </div>
      )}
    </div>
  );
});

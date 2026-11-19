"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Bookmark, ChevronDown, Compass, Layers3, Map as MapIcon, Menu, Moon, Navigation2, QrCode, RotateCcw, Search, Settings2, Sun, TrainFront, X } from "lucide-react";
import { AMapView, type MapHandle } from "@/components/map/AMapView";
import { AreaNavigator } from "@/components/AreaNavigator";
import { DiscoverPanel } from "@/components/DiscoverPanel";
import { LayerPanel } from "@/components/LayerPanel";
import { MetroDialog } from "@/components/MetroDialog";
import { AtlasLibrary } from "@/components/panels/AtlasLibrary";
import { DetailPanel } from "@/components/panels/DetailPanel";
import { SearchBox } from "@/components/SearchBox";
import { SettingsDialog } from "@/components/SettingsDialog";
import { DEFAULT_LAYERS } from "@/data/layers";
import { CURATED_PLACE_BY_ID } from "@/data/places";
import { DISTRICTS, DISTRICT_BY_ID, STREET_BY_ID } from "@/data/districts";
import { useAtlasStore } from "@/lib/store/atlas-store";
import type { BaseMapMode } from "@/lib/map/amap-service";
import type { SearchEntry } from "@/lib/search/search";
import type { AtlasPlace, CuratedPlace, District, ExplorationRecord, LayerId, Street } from "@/types/atlas";
import type { AtlasSelection } from "@/types/selection";

type LeftTab = "areas" | "layers";
type MobilePanel = "areas" | "layers" | "discover" | "library" | null;

function getSelectionKey(selection: AtlasSelection): string {
  if (selection.kind === "district") return `district-${selection.districtId}`;
  if (selection.kind === "street") return `street-${selection.streetId}`;
  if (selection.kind === "curated") return `curated-${selection.curatedId}`;
  if (selection.kind === "community") return `community-${selection.streetId}-${selection.communityName}`;
  return `place-${selection.place.id}`;
}

export default function AtlasApp() {
  const mapRef = useRef<MapHandle>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mapMode, setMapMode] = useState<BaseMapMode>("standard");
  const [viewMode, setViewMode] = useState<"2D" | "3D">("3D");
  const [layers, setLayers] = useState<Record<LayerId, boolean>>(DEFAULT_LAYERS);
  const [layerCounts, setLayerCounts] = useState<Partial<Record<LayerId, number>>>({});
  const [mapReady, setMapReady] = useState(false);
  const [selection, setSelection] = useState<AtlasSelection | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<LeftTab>("areas");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [metroOpen, setMetroOpen] = useState(false);
  const metroRequest = useRef(0);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [toast, setToast] = useState("");
  const { markViewed, setHydrated } = useAtlasStore();

  useEffect(() => {
    useAtlasStore.persist.rehydrate().finally(() => setHydrated(true));
  }, [setHydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!selection) return;
    if (selection.kind === "district") {
      const district = DISTRICT_BY_ID.get(selection.districtId);
      if (district) markViewed({ id: district.id, name: district.name, category: district.kind, districtName: district.name });
    } else if (selection.kind === "street") {
      const street = STREET_BY_ID.get(selection.streetId);
      const district = street ? DISTRICT_BY_ID.get(street.districtId) : undefined;
      if (street && district) markViewed({ id: street.id, name: street.name, category: "街道", districtName: district.name, place: selection.resolvedPlace });
    } else if (selection.kind === "curated") {
      const curated = CURATED_PLACE_BY_ID.get(selection.curatedId);
      const district = curated ? DISTRICT_BY_ID.get(curated.districtId) : undefined;
      if (curated && district) markViewed({ id: curated.id, name: curated.name, category: curated.category, districtName: district.name, place: selection.place });
    } else if (selection.kind === "community") {
      const street = STREET_BY_ID.get(selection.streetId);
      const district = street ? DISTRICT_BY_ID.get(street.districtId) : undefined;
      if (street && district) markViewed({ id: `${street.id}:${selection.communityName}`, name: selection.communityName, category: "社区", districtName: district.name, place: selection.place });
    } else {
      markViewed({ id: selection.place.id, name: selection.place.name, category: selection.place.category, districtName: selection.place.districtName, place: selection.place });
    }
  }, [selection, markViewed]);

  useEffect(() => {
    if (!selection || selection.kind !== "street" || !selection.resolving) return;
    const street = STREET_BY_ID.get(selection.streetId);
    const district = street ? DISTRICT_BY_ID.get(street.districtId) : undefined;
    if (!street || !district) return;
    if (!mapReady) return;
    let cancelled = false;
    mapRef.current?.focusStreet(district, street)
      .then((place) => {
        if (cancelled) return;
        setSelection({ kind: "street", streetId: street.id, resolving: false, resolvedPlace: place ?? undefined, error: place ? "" : "地图服务未返回可确认的街道位置；未生成示意边界。" });
      })
      .catch((error: unknown) => { if (!cancelled) setSelection({ kind: "street", streetId: street.id, resolving: false, error: error instanceof Error ? error.message : "街道定位失败" }); });
    return () => { cancelled = true; };
  }, [selection, mapReady]);

  useEffect(() => {
    if (!selection || selection.kind !== "curated" || !selection.resolving) return;
    const curated = CURATED_PLACE_BY_ID.get(selection.curatedId);
    if (!curated) return;
    if (!mapReady) return;
    let cancelled = false;
    mapRef.current?.focusCurated(curated)
      .then((place) => {
        if (cancelled) return;
        setSelection({ kind: "curated", curatedId: curated.id, resolving: false, place: place ?? undefined, error: place ? "" : "地图服务未返回可确认的位置，请尝试全局搜索更完整的名称。" });
      })
      .catch((error: unknown) => { if (!cancelled) setSelection({ kind: "curated", curatedId: curated.id, resolving: false, error: error instanceof Error ? error.message : "地点定位失败" }); });
    return () => { cancelled = true; };
  }, [selection, mapReady]);

  useEffect(() => {
    if (!selection || selection.kind !== "community" || !selection.resolving) return;
    const street = STREET_BY_ID.get(selection.streetId);
    const district = street ? DISTRICT_BY_ID.get(street.districtId) : undefined;
    if (!street || !district) return;
    let cancelled = false;
    const shortName = selection.communityName.replace(/(社区)?居委会$/, "");
    const candidates = [`${district.name}${shortName}`, `${selection.communityName}`, shortName];
    const attempt = (index: number) => {
      if (cancelled || index >= candidates.length) {
        if (!cancelled) setSelection({ kind: "community", streetId: street.id, communityName: selection.communityName, resolving: false, error: "地图服务未返回可确认的社区位置；名录仍来自统计局公开数据。" });
        return;
      }
      mapRef.current?.searchGlobal(candidates[index] ?? "")
        .then((places) => {
          if (cancelled) return;
          const districtShort = district.name.replace(/区|新区/g, "");
          const matched = places.find((place) => place.name.includes(shortName) && (!districtShort || place.districtName.includes(districtShort))) ?? places.find((place) => place.name.includes(shortName));
          if (matched) {
            mapRef.current?.focusPlace(matched);
            setSelection({ kind: "community", streetId: street.id, communityName: selection.communityName, resolving: false, place: matched });
          } else attempt(index + 1);
        })
        .catch(() => { if (!cancelled) attempt(index + 1); });
    };
    attempt(0);
    return () => { cancelled = true; };
  }, [selection, mapReady]);

  const selectDistrict = (district: District) => {
    setSelectedDistrictId(district.id);
    setSelection({ kind: "district", districtId: district.id });
    setSheetExpanded(false);
    setMobilePanel(null);
    setMobileLeftOpen(false);
    if (mapReady) mapRef.current?.focusDistrict(district.id);
  };

  const selectStreet = (district: District, street: Street) => {
    setSelectedDistrictId(district.id);
    setSelection({ kind: "street", streetId: street.id, resolving: mapReady, error: mapReady ? undefined : "真实地图未连接，暂不能核验街道位置。街道名称与所属区仍来自官方目录。" });
    setSheetExpanded(false);
    setMobilePanel(null);
    setMobileLeftOpen(false);
  };

  const selectCommunity = (district: District, street: Street, communityName: string) => {
    setSelectedDistrictId(district.id);
    setSelection({ kind: "community", streetId: street.id, communityName, resolving: mapReady, error: mapReady ? undefined : "真实地图未连接，暂不能核验社区位置。社区名录来自统计局公开数据。" });
    setSheetExpanded(false);
    setMobilePanel(null);
    setMobileLeftOpen(false);
  };

  const selectCurated = (curated: CuratedPlace) => {
    setSelectedDistrictId(curated.districtId);
    setSelection({
      kind: "curated",
      curatedId: curated.id,
      resolving: mapReady,
      error: mapReady ? undefined : "真实地图未连接，暂不能核验该地点的位置与地址。",
    });
    setSheetExpanded(false);
    setMobilePanel(null);
    setMobileLeftOpen(false);
  };

  const selectPlace = (place: AtlasPlace) => {
    const district = DISTRICTS.find((item) => item.name === place.districtName);
    setSelectedDistrictId(district?.id ?? null);
    setSelection({ kind: "place", place });
    setSheetExpanded(false);
    setMobilePanel(null);
    setMobileLeftOpen(false);
    mapRef.current?.focusPlace(place);
    void mapRef.current?.describePlace(place).then((resolved) => {
      if (resolved === place) return;
      setSelection((current) => current?.kind === "place" && current.place.id === place.id
        ? { kind: "place", place: resolved }
        : current);
    }).catch(() => undefined);
  };

  const closeMetro = () => {
    metroRequest.current += 1;
    setMetroOpen(false);
  };

  const selectMetroStation = async (station: string) => {
    const request = ++metroRequest.current;
    const place = await mapRef.current?.locateMetroStation(station);
    if (!place || metroRequest.current !== request) return false;
    closeMetro();
    selectPlace(place);
    return true;
  };

  const selectSearchEntry = (entry: SearchEntry) => {
    if (entry.kind === "district") selectDistrict(entry.data);
    else if (entry.kind === "street") {
      const district = DISTRICT_BY_ID.get(entry.data.districtId);
      if (district) selectStreet(district, entry.data);
    } else selectCurated(entry.data);
  };

  const openRecord = (id: string, record: ExplorationRecord) => {
    const district = DISTRICT_BY_ID.get(id);
    if (district) { selectDistrict(district); return; }
    const street = STREET_BY_ID.get(id);
    if (street) {
      const parent = DISTRICT_BY_ID.get(street.districtId);
      if (parent) selectStreet(parent, street);
      return;
    }
    const curated = CURATED_PLACE_BY_ID.get(id);
    if (curated) { selectCurated(curated); return; }
    if (record.place) selectPlace(record.place);
  };

  const currentAreaName = selectedDistrictId ? DISTRICT_BY_ID.get(selectedDistrictId)?.name : "深圳市";
  const selectedStreetId = selection?.kind === "street" ? selection.streetId : undefined;
  const showMobileSheet = Boolean(selection) && !mobilePanel;

  const renderPanel = (panel: LeftTab | "discover" | "library") => {
    if (panel === "areas") return <AreaNavigator selectedDistrictId={selectedDistrictId} selectedStreetId={selectedStreetId} onDistrictSelect={selectDistrict} onStreetSelect={selectStreet} />;
    if (panel === "layers") return <LayerPanel layers={layers} counts={layerCounts} mapReady={mapReady} onToggle={(id) => setLayers((previous) => ({ ...previous, [id]: !previous[id] }))} />;
    if (panel === "discover") return <DiscoverPanel onSelect={selectCurated} />;
    return <AtlasLibrary onOpenRecord={openRecord} />;
  };

  return (
    <main className="atlas-app" data-theme={theme}>
      <header className="topbar">
        <div className="brand-block">
          <button className="mobile-menu-button icon-button" type="button" onClick={() => { setMobileLeftOpen(!mobileLeftOpen); setMobilePanel(mobileLeftOpen ? null : leftTab); }} aria-label="打开区域与图层"><Menu size={19} /></button>
          <div className="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M20 4 34 12v16L20 36 6 28V12Z" /><path d="m6 12 14 8 14-8M20 20v16M13 8l14 8v16" /></svg></div>
          <div className="brand-copy"><strong>深圳城市图鉴 <span>3D</span></strong><small>SHENZHEN ATLAS</small></div>
          <div className="current-area"><span>/</span>{currentAreaName}<ChevronDown size={13} /></div>
        </div>
        <SearchBox mapReady={mapReady} onSelect={selectSearchEntry} onPlaceSelect={selectPlace} onRemoteSearch={(query) => mapRef.current?.searchGlobal(query) ?? Promise.reject(new Error("地图尚未连接"))} />
        <div className="top-actions">
          <div className="view-switch" aria-label="地图维度"><button type="button" className={viewMode === "2D" ? "active" : ""} onClick={() => setViewMode("2D")}>2D</button><button type="button" className={viewMode === "3D" ? "active" : ""} onClick={() => setViewMode("3D")}><Box size={14} />3D</button></div>
          <button className="icon-button desktop-action" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="切换深浅主题">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
          <button className="icon-button" type="button" onClick={() => setSettingsOpen(true)} aria-label="本地访问与地图设置"><Settings2 size={18} /></button>
        </div>
      </header>

      <div className="workspace">
        <aside className={`left-sidebar ${mobileLeftOpen ? "mobile-open" : ""}`}>
          <div className="sidebar-tabs"><button type="button" className={leftTab === "areas" ? "active" : ""} onClick={() => { setLeftTab("areas"); setMobilePanel("areas"); }}><MapIcon size={15} />区域</button><button type="button" className={leftTab === "layers" ? "active" : ""} onClick={() => { setLeftTab("layers"); setMobilePanel("layers"); }}><Layers3 size={15} />图层</button><button className="mobile-sidebar-close icon-button" type="button" onClick={() => { setMobileLeftOpen(false); setMobilePanel(null); }} aria-label="关闭侧栏"><X size={17} /></button></div>
          <div className="sidebar-scroll">{renderPanel(leftTab)}</div>
          <div className="sidebar-footer"><span className="status-dot online" /><span>官方区划目录</span><strong>10 / 74</strong></div>
        </aside>

        <section className="map-workspace">
          <AMapView
            ref={mapRef}
            layers={layers}
            mapMode={mapMode}
            viewMode={viewMode}
            theme={theme}
            selectedDistrictId={selectedDistrictId}
            onDistrictSelect={(id) => { const district = DISTRICT_BY_ID.get(id); if (district) selectDistrict(district); }}
            onPlaceSelect={selectPlace}
            onReadyChange={setMapReady}
            onError={setToast}
            onLayerCounts={setLayerCounts}
          />
          <div className="map-mode-control floating-control">
            {(["standard", "satellite", "night"] as BaseMapMode[]).map((mode) => <button type="button" key={mode} className={mapMode === mode ? "active" : ""} onClick={() => setMapMode(mode)}>{mode === "standard" ? "标准" : mode === "satellite" ? "卫星" : "夜间"}</button>)}
          </div>
          <div className="map-tools floating-control">
            <button type="button" onClick={() => mapRef.current?.resetNorth()} aria-label="回正北"><Navigation2 size={18} /><span>回正北</span></button>
            <button type="button" onClick={() => { setSelectedDistrictId(null); setSelection(null); mapRef.current?.resetView(); }} aria-label="恢复深圳全市视角"><RotateCcw size={18} /><span>全市视角</span></button>
            <button className="desktop-map-tool" type="button" onClick={() => setSettingsOpen(true)} aria-label="显示手机二维码"><QrCode size={18} /><span>手机访问</span></button>
            <button className="desktop-map-tool" type="button" onClick={() => setMetroOpen(true)} aria-label="打开地铁线路图"><TrainFront size={18} /><span>地铁</span></button>
          </div>
          <div className="mobile-map-caption"><span>{viewMode} · {mapMode === "standard" ? "标准" : mapMode === "satellite" ? "卫星" : "夜间"}</span><button type="button" onClick={() => setViewMode(viewMode === "3D" ? "2D" : "3D")}>{viewMode === "3D" ? "切换 2D" : "切换 3D"}</button></div>
        </section>

        {selection && <div className={`desktop-detail-container ${selection ? "visible" : ""}`}><DetailPanel key={getSelectionKey(selection)} selection={selection} expanded={sheetExpanded} onToggleExpanded={() => setSheetExpanded(!sheetExpanded)} onClose={() => setSelection(null)} onStreetSelect={(street) => { const district = DISTRICT_BY_ID.get(street.districtId); if (district) selectStreet(district, street); }} onCommunitySelect={(street, communityName) => { const district = DISTRICT_BY_ID.get(street.districtId); if (district) selectCommunity(district, street, communityName); }} onPlaceSelect={selectPlace} onNearby={(origin, keyword, category) => mapRef.current?.searchNearby(origin, keyword, category) ?? Promise.reject(new Error("地图尚未连接"))} /></div>}
      </div>

      {showMobileSheet && selection && <div className="mobile-detail-container"><DetailPanel key={getSelectionKey(selection)} selection={selection} expanded={sheetExpanded} onToggleExpanded={() => setSheetExpanded(!sheetExpanded)} onClose={() => setSelection(null)} onStreetSelect={(street) => { const district = DISTRICT_BY_ID.get(street.districtId); if (district) selectStreet(district, street); }} onCommunitySelect={(street, communityName) => { const district = DISTRICT_BY_ID.get(street.districtId); if (district) selectCommunity(district, street, communityName); }} onPlaceSelect={selectPlace} onNearby={(origin, keyword, category) => mapRef.current?.searchNearby(origin, keyword, category) ?? Promise.reject(new Error("地图尚未连接"))} /></div>}

      {mobilePanel && !mobileLeftOpen && <div className="mobile-full-panel"><div className="mobile-panel-header"><strong>{mobilePanel === "areas" ? "区域目录" : mobilePanel === "layers" ? "城市图层" : mobilePanel === "discover" ? "发现深圳" : "我的图鉴"}</strong><button className="icon-button" type="button" onClick={() => setMobilePanel(null)} aria-label="关闭面板"><X size={18} /></button></div><div className="mobile-panel-scroll">{renderPanel(mobilePanel)}</div></div>}

      <nav className="mobile-bottom-nav" aria-label="主要功能">
        <button type="button" className={!mobilePanel ? "active" : ""} onClick={() => { setMobilePanel(null); setMobileLeftOpen(false); setSelection(null); }}><MapIcon size={20} /><span>地图</span></button>
        <button type="button" className={mobilePanel === "areas" ? "active" : ""} onClick={() => { setMobilePanel("areas"); setMobileLeftOpen(false); }}><Search size={20} /><span>区域</span></button>
        <button type="button" onClick={() => setMetroOpen(true)} aria-label="打开地铁线路图"><TrainFront size={20} /><span>地铁</span></button>
        <button type="button" className={mobilePanel === "discover" ? "active" : ""} onClick={() => { setMobilePanel("discover"); setMobileLeftOpen(false); }}><Compass size={20} /><span>发现</span></button>
        <button type="button" className={mobilePanel === "library" ? "active" : ""} onClick={() => { setMobilePanel("library"); setMobileLeftOpen(false); }}><Bookmark size={20} /><span>我的</span></button>
      </nav>

      {toast && <div className="toast" role="status">{toast}</div>}
      {metroOpen && <MetroDialog onClose={closeMetro} onStation={selectMetroStation} />}
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} mapReady={mapReady} />
    </main>
  );
}

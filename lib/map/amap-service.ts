import { DISTRICT_BY_ID } from "@/data/districts";
import { straightLineDistance } from "@/lib/geo/distance";
import { loadAMap } from "@/lib/map/amap-loader";
import type { AtlasPlace, CuratedPlace, District, LayerId, NearbyPlace, PlaceCategory, Street } from "@/types/atlas";

export type BaseMapMode = "standard" | "satellite" | "night";

const SHENZHEN_CENTER: [number, number] = [114.0579, 22.5431];
const AMAP_SOURCE = { name: "高德地图 JS API 2.0", url: "https://lbs.amap.com/" };

function createMarkerElement(place: AtlasPlace, selected = false): HTMLElement {
  const element = document.createElement("div");
  element.className = selected ? "atlas-selection-marker" : "atlas-poi-marker";
  element.setAttribute("aria-label", place.name);
  const dot = document.createElement("span");
  dot.className = "atlas-marker-dot";
  const label = document.createElement("span");
  label.className = "atlas-marker-label";
  label.textContent = place.name;
  element.append(dot, label);
  return element;
}

/** 地图服务适配器：所有高德原始结构都在此处转换为统一地点模型。 */
export class ShenzhenMapService {
  private readonly map: AMap.Map;
  private readonly districtPolygons = new Map<string, AMap.Polygon[]>();
  private readonly districtCenters = new Map<string, [number, number]>();
  private readonly layerMarkers = new Map<LayerId, AMap.Marker[]>();
  private readonly layerRequests = new Map<LayerId, number>();
  private readonly onPlaceSelect: (place: AtlasPlace) => void;
  private selectionMarker: AMap.Marker | null = null;
  private is3D = true;
  private satellite: AMap.TileLayer.Satellite | null = null;

  private constructor(map: AMap.Map, onPlaceSelect: (place: AtlasPlace) => void) {
    this.map = map;
    this.onPlaceSelect = onPlaceSelect;
  }

  static async create(container: HTMLElement, onPlaceSelect: (place: AtlasPlace) => void): Promise<ShenzhenMapService> {
    const api = await loadAMap();
    const map = new api.Map(container, {
      center: SHENZHEN_CENTER,
      zoom: 10.2,
      viewMode: "3D",
      pitch: 46,
      rotation: 0,
      mapStyle: "amap://styles/darkblue",
      features: ["bg", "road", "building", "point"],
      showLabel: true,
      resizeEnable: true,
    });
    api.plugin("AMap.Scale", () => map.add(new api.Scale()));
    return new ShenzhenMapService(map, onPlaceSelect);
  }

  getZoom(): number {
    return this.map.getZoom();
  }

  onZoomChange(callback: () => void): void {
    this.map.on("zoomend", callback);
  }

  setViewMode(mode: "2D" | "3D"): void {
    this.is3D = mode === "3D";
    this.map.setStatus({ pitchEnable: this.is3D, rotateEnable: this.is3D });
    this.map.setPitch(this.is3D ? 48 : 0, false, 450);
    if (!this.is3D) this.resetNorth();
  }

  setBaseMode(mode: BaseMapMode, theme: "dark" | "light"): void {
    if (mode === "satellite") {
      if (!this.satellite) this.satellite = new AMap.TileLayer.Satellite();
      this.satellite.setMap(this.map);
      return;
    }
    this.satellite?.setMap(null);
    this.map.setMapStyle(mode === "night" ? "amap://styles/darkblue" : theme === "light" ? "amap://styles/light" : "amap://styles/dark");
  }

  setBuildingsVisible(visible: boolean): void {
    this.map.setFeatures(visible ? ["bg", "road", "building", "point"] : ["bg", "road", "point"]);
  }

  resetNorth(): void {
    this.map.setRotation(0, false, 400);
  }

  resetView(): void {
    this.map.setZoomAndCenter(10.2, SHENZHEN_CENTER, false, 800);
    this.map.setRotation(0, false, 500);
    this.map.setPitch(this.is3D ? 46 : 0, false, 600);
  }

  private queryDistrict(district: District): Promise<AMap.District | null> {
    return new Promise((resolve, reject) => {
      const search = new AMap.DistrictSearch({ level: "district", extensions: "all", subdistrict: 0 });
      const timer = window.setTimeout(() => reject(new Error(`${district.name}边界查询超时`)), 20_000);
      search.search(district.adcode ?? district.name, (status, result) => {
        window.clearTimeout(timer);
        if (status === "complete") {
          const match = result.districtList?.find((entry) => district.adcode
            ? String(entry.adcode) === district.adcode
            : entry.name === district.name);
          resolve(match ?? null);
        } else if (status === "no_data") resolve(null);
        else reject(new Error(`${district.name}边界查询失败：${result.info ?? status}`));
      });
    });
  }

  async loadDistrictBoundaries(onSelect: (districtId: string) => void): Promise<{ loaded: number; unavailable: string[] }> {
    const unavailable: string[] = [];
    let loaded = 0;
    await Promise.all(Array.from(DISTRICT_BY_ID.values()).map(async (district) => {
      try {
        const result = await this.queryDistrict(district);
        if (result?.center) this.districtCenters.set(district.id, [result.center.getLng(), result.center.getLat()]);
        if (!result?.boundaries?.length) {
          unavailable.push(district.name);
          return;
        }
        const polygons = result.boundaries.map((path) => {
          const polygon = new AMap.Polygon({
            path: [path],
            strokeColor: district.color,
            strokeWeight: 1,
            strokeOpacity: 0.75,
            fillColor: district.color,
            fillOpacity: 0.07,
            bubble: true,
            cursor: "pointer",
            zIndex: 12,
          });
          polygon.on("click", () => onSelect(district.id));
          this.map.add(polygon);
          return polygon;
        });
        this.districtPolygons.set(district.id, polygons);
        loaded += 1;
      } catch {
        unavailable.push(district.name);
      }
    }));
    return { loaded, unavailable };
  }

  setDistrictBoundariesVisible(visible: boolean): void {
    this.districtPolygons.forEach((polygons) => polygons.forEach((polygon) => polygon.setMap(visible ? this.map : null)));
  }

  highlightDistrict(districtId: string | null): void {
    this.districtPolygons.forEach((polygons, id) => {
      const district = DISTRICT_BY_ID.get(id);
      if (!district) return;
      const selected = id === districtId;
      polygons.forEach((polygon) => polygon.setOptions({
        strokeColor: selected ? "#b9fff0" : district.color,
        strokeWeight: selected ? 2.5 : 1,
        strokeOpacity: districtId && !selected ? 0.22 : 0.82,
        fillOpacity: selected ? 0.2 : districtId ? 0.025 : 0.07,
        zIndex: selected ? 22 : 12,
      }));
    });
  }

  flyToDistrict(districtId: string): boolean {
    const polygons = this.districtPolygons.get(districtId);
    if (polygons?.length) {
      this.map.setFitView(polygons, false, [72, 72, 72, 72], 13);
      if (this.is3D) this.map.setPitch(48, false, 650);
      return true;
    }
    const center = this.districtCenters.get(districtId);
    if (center) {
      this.map.setZoomAndCenter(12, center, false, 700);
      return true;
    }
    return false;
  }

  private convertPoi(poi: AMap.Poi, category: PlaceCategory): AtlasPlace | null {
    if (!poi.location || !Number.isFinite(poi.location.getLng()) || !Number.isFinite(poi.location.getLat())) return null;
    return {
      id: `amap-${poi.id}`,
      name: poi.name,
      category,
      address: typeof poi.address === "string" ? poi.address : "",
      districtName: poi.adname ?? "",
      location: { lng: poi.location.getLng(), lat: poi.location.getLat() },
      coordinateSystem: "GCJ-02",
      source: AMAP_SOURCE,
      updatedAt: new Date().toISOString(),
      confidence: "地图服务检索",
      rawType: poi.type,
      phone: typeof poi.tel === "string" ? poi.tel : undefined,
    };
  }

  private searchPlaces(keyword: string, category: PlaceCategory): Promise<AtlasPlace[]> {
    return new Promise((resolve, reject) => {
      const search = new AMap.PlaceSearch({ city: "深圳", citylimit: true, pageSize: 20, extensions: "base" });
      search.search(keyword, (status, result) => {
        if (status === "no_data") {
          resolve([]);
          return;
        }
        if (status !== "complete") {
          reject(new Error(result.info ?? "地点检索失败"));
          return;
        }
        resolve((result.poiList?.pois ?? []).map((poi) => this.convertPoi(poi, category)).filter((place): place is AtlasPlace => place !== null));
      });
    });
  }

  async searchGlobal(keyword: string): Promise<AtlasPlace[]> {
    return this.searchPlaces(keyword, "其他地点");
  }

  async locateCurated(curated: CuratedPlace): Promise<AtlasPlace | null> {
    const district = DISTRICT_BY_ID.get(curated.districtId);
    const results = await this.searchPlaces(curated.name, curated.category);
    const districtShortName = district?.name.replace(/区|新区/g, "");
    const exact = results.find((place) => place.name === curated.name && (!districtShortName || place.districtName.includes(districtShortName)))
      ?? results.find((place) => place.name.includes(curated.name) && (!districtShortName || place.districtName.includes(districtShortName)));
    return exact ?? null;
  }

  async locateStreet(district: District, street: Street): Promise<AtlasPlace | null> {
    const streetBase = street.name.replace("街道", "");
    const results = await this.searchPlaces(`${district.name}${street.name}办事处`, "政务设施");
    const districtShortName = district.name.replace(/区|新区/g, "");
    return results.find((place) => place.name.includes(streetBase) && (!districtShortName || place.districtName.includes(districtShortName)))
      ?? results.find((place) => place.name.includes(streetBase))
      ?? null;
  }

  flyToPlace(place: AtlasPlace): void {
    if (this.selectionMarker) this.selectionMarker.setMap(null);
    this.selectionMarker = new AMap.Marker({
      position: [place.location.lng, place.location.lat],
      content: createMarkerElement(place, true),
      title: place.name,
      anchor: "bottom-center",
      zIndex: 120,
    });
    this.map.add(this.selectionMarker);
    this.map.setZoomAndCenter(15.2, [place.location.lng, place.location.lat], false, 750);
    if (this.is3D) this.map.setPitch(50, false, 650);
  }

  clearLayer(layerId: LayerId): void {
    this.layerRequests.set(layerId, (this.layerRequests.get(layerId) ?? 0) + 1);
    this.layerMarkers.get(layerId)?.forEach((marker) => marker.setMap(null));
    this.layerMarkers.set(layerId, []);
  }

  async syncPlaceLayer(layerId: LayerId, keyword: string, category: PlaceCategory, districtName?: string): Promise<number> {
    const requestId = (this.layerRequests.get(layerId) ?? 0) + 1;
    this.layerRequests.set(layerId, requestId);
    this.layerMarkers.get(layerId)?.forEach((marker) => marker.setMap(null));
    this.layerMarkers.set(layerId, []);
    const places = await this.searchPlaces(districtName ? `${districtName}${keyword}` : keyword, category);
    if (this.layerRequests.get(layerId) !== requestId) return 0;
    const markers = places.map((place) => {
      const marker = new AMap.Marker({
        position: [place.location.lng, place.location.lat],
        content: createMarkerElement(place),
        title: `${place.name} · ${place.category}`,
        anchor: "bottom-center",
        zIndex: 60,
      });
      marker.on("click", () => {
        this.flyToPlace(place);
        this.onPlaceSelect(place);
      });
      this.map.add(marker);
      return marker;
    });
    this.layerMarkers.set(layerId, markers);
    return markers.length;
  }

  async searchNearby(origin: AtlasPlace, keyword: string, category: PlaceCategory, radius = 1500): Promise<NearbyPlace[]> {
    const places = await new Promise<AtlasPlace[]>((resolve, reject) => {
      const search = new AMap.PlaceSearch({ city: "深圳", citylimit: true, pageSize: 10, extensions: "base" });
      search.searchNearBy(keyword, [origin.location.lng, origin.location.lat], radius, (status, result) => {
        if (status === "no_data") resolve([]);
        else if (status === "complete") resolve((result.poiList?.pois ?? []).map((poi) => this.convertPoi(poi, category)).filter((place): place is AtlasPlace => place !== null));
        else reject(new Error(result.info ?? "周边检索失败"));
      });
    });
    return places
      .filter((place) => place.id !== origin.id)
      .map((place) => ({ place, straightLineDistance: straightLineDistance(origin.location, place.location) }))
      .sort((a, b) => a.straightLineDistance - b.straightLineDistance)
      .slice(0, 6);
  }

  destroy(): void {
    this.layerMarkers.forEach((markers) => markers.forEach((marker) => marker.setMap(null)));
    this.selectionMarker?.setMap(null);
    this.map.destroy();
  }
}

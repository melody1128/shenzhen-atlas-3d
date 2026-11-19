import { DISTRICT_BY_ID } from "@/data/districts";
import { LAYER_DEFINITIONS } from "@/data/layers";
import { straightLineDistance } from "@/lib/geo/distance";
import { loadAMap } from "@/lib/map/amap-loader";
import { classifyPlace, PLACE_BADGES } from "@/lib/map/places";
import type { AtlasPlace, CuratedPlace, District, LayerId, NearbyPlace, PlaceCategory, Street } from "@/types/atlas";

export type BaseMapMode = "standard" | "satellite" | "night";

const SHENZHEN_CENTER: [number, number] = [114.0579, 22.5431];
const AMAP_SOURCE = { name: "高德地图 JS API 2.0", url: "https://lbs.amap.com/" };

function createMarkerElement(place: AtlasPlace, selected = false): HTMLElement {
  const element = document.createElement(selected ? "div" : "button");
  if (element instanceof HTMLButtonElement) element.type = "button";
  element.className = selected ? "atlas-selection-marker" : "atlas-poi-marker";
  const badge = PLACE_BADGES[place.category];
  element.setAttribute("aria-label", `${place.category} · ${place.name}`);
  element.style.setProperty("--poi-color", badge.color);
  const dot = document.createElement("span");
  dot.className = "atlas-marker-glyph";
  dot.textContent = badge.glyph;
  dot.setAttribute("aria-hidden", "true");
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
  private markers: AMap.Marker[] = [];
  private viewportRequest = 0;
  private selectedPlaceId: string | null = null;
  private readonly resolvedAddresses = new Map<string, Promise<AtlasPlace>>();
  private readonly onPlaceSelect: (place: AtlasPlace) => void;
  private readonly container: HTMLElement;
  private readonly baseLayers: AMap.TileLayer[];
  private selectionMarker: AMap.Marker | null = null;
  private is3D = true;
  private satellite: AMap.TileLayer.Satellite | null = null;
  private buildingLayer: AMap.Buildings | null = null;
  private baseMode: BaseMapMode = "standard";
  private buildingsEnabled = true;

  private constructor(map: AMap.Map, container: HTMLElement, onPlaceSelect: (place: AtlasPlace) => void) {
    this.map = map;
    this.container = container;
    this.baseLayers = [...map.getLayers()];
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
      features: ["bg", "road"],
      showLabel: false,
      showBuildingBlock: false,
      showIndoorMap: false,
      resizeEnable: true,
    });
    api.plugin("AMap.Scale", () => map.add(new api.Scale()));
    return new ShenzhenMapService(map, container, onPlaceSelect);
  }

  getZoom(): number {
    return this.map.getZoom();
  }

  onViewportChange(callback: () => void): () => void {
    this.map.on("moveend", callback);
    this.map.on("zoomend", callback);
    return () => {
      this.map.off("moveend", callback);
      this.map.off("zoomend", callback);
    };
  }

  setViewMode(mode: "2D" | "3D"): void {
    this.is3D = mode === "3D";
    this.map.setStatus({ pitchEnable: this.is3D, rotateEnable: this.is3D });
    this.map.setPitch(this.is3D ? this.preferredPitch() : 0, false, 450);
    if (!this.is3D) this.resetNorth();
    this.updateBuildings();
  }

  setBaseMode(mode: BaseMapMode, theme: "dark" | "light"): void {
    const wasSatellite = this.baseMode === "satellite";
    this.baseMode = mode;
    if (this.is3D && wasSatellite !== (mode === "satellite")) this.map.setPitch(this.preferredPitch(), false, 450);
    if (mode === "satellite") {
      this.updateBuildings();
      if (!this.satellite) this.satellite = new AMap.TileLayer.Satellite();
      if (!wasSatellite) this.map.setLayers([this.satellite]);
      return;
    }
    if (wasSatellite) this.map.setLayers(this.baseLayers);
    this.map.setMapStyle(mode === "night" ? "amap://styles/darkblue" : theme === "light" ? "amap://styles/whitesmoke" : "amap://styles/normal");
    this.updateBuildings();
  }

  setBuildingsVisible(visible: boolean): void {
    this.buildingsEnabled = visible;
    this.updateBuildings();
  }

  private updateBuildings(): void {
    const visible = this.buildingsEnabled && this.is3D && this.baseMode !== "satellite";
    if (visible && !this.buildingLayer && typeof AMap.Buildings === "function") {
      this.buildingLayer = new AMap.Buildings({
        zooms: [16.8, 20],
        roofColor: "#e0ddd4",
        wallColor: "#a9b0b2",
        heightFactor: 1,
      });
    }
    this.buildingLayer?.setMap(visible ? this.map : null);
  }

  private preferredPitch(): number {
    return this.baseMode === "satellite" ? 31 : 43;
  }

  resetNorth(): void {
    this.map.setRotation(0, false, 400);
  }

  resetView(): void {
    this.map.setZoomAndCenter(10.2, SHENZHEN_CENTER, false, 800);
    this.map.setRotation(0, false, 500);
    this.map.setPitch(this.is3D ? this.preferredPitch() : 0, false, 600);
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
    const districts = [...DISTRICT_BY_ID.values()];
    const loadBoundary = async (district: District) => {
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
            cursor: "default",
            zIndex: 12,
          });
          polygon.on("click", () => {
            if (this.getZoom() < 12) onSelect(district.id);
          });
          this.map.add(polygon);
          return polygon;
        });
        this.districtPolygons.set(district.id, polygons);
        loaded += 1;
      } catch {
        unavailable.push(district.name);
      }
    };

    // Limit simultaneous requests so district queries leave capacity for POI lookups.
    const batchSize = 3;
    for (let start = 0; start < districts.length; start += batchSize) {
      await Promise.all(districts.slice(start, start + batchSize).map(loadBoundary));
    }
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
      if (this.is3D) this.map.setPitch(this.preferredPitch(), false, 650);
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
    const lng = poi.location?.getLng();
    const lat = poi.location?.getLat();
    if (lng === undefined || lat === undefined || !Number.isFinite(lng) || !Number.isFinite(lat)) return null;

    const districtName = poi.adname ?? "";
    const providerAddress = typeof poi.address === "string" ? poi.address.trim() : "";
    const isLineName = category === "地铁站" && /号线|罗宝线/.test(providerAddress) && !/路|大道|街道/.test(providerAddress);
    const road = isLineName ? "" : providerAddress;
    const districtAddress = districtName && !road.includes(districtName) ? districtName + (road || poi.name) : road || poi.name;
    const address = districtAddress.startsWith("深圳") ? districtAddress : `深圳市${districtAddress}`;
    return {
      id: `amap-${poi.id}`,
      name: poi.name,
      category,
      address,
      districtName,
      location: { lng, lat },
      coordinateSystem: "GCJ-02",
      source: AMAP_SOURCE,
      updatedAt: new Date().toISOString(),
      confidence: "地图服务检索",
      rawType: poi.type,
      phone: typeof poi.tel === "string" ? poi.tel : undefined,
    };
  }

  private queryPlaces(
    keyword: string,
    options: { types?: string; center?: AMap.LngLatTuple; radius?: number; pageSize?: number } = {},
  ): Promise<AMap.Poi[]> {
    const search = new AMap.PlaceSearch({
      city: "深圳", citylimit: true, pageSize: options.pageSize ?? 25, extensions: "base",
      ...(options.types ? { type: options.types } : {}),
    });
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("地点检索超时")), 18_000);
      const complete = (status: string, result: AMap.PlaceSearchResult) => {
        window.clearTimeout(timer);
        if (status === "no_data") resolve([]);
        else if (status === "complete") resolve(result.poiList?.pois ?? []);
        else reject(new Error(result.info ?? "地点检索失败"));
      };
      if (options.center) search.searchNearBy(keyword, options.center, options.radius ?? 1500, complete);
      else search.search(keyword, complete);
    });
  }

  private async searchPlaces(keyword: string, category: PlaceCategory) {
    const pois = await this.queryPlaces(keyword);
    return pois.map((poi) => this.convertPoi(poi, category)).filter((place) => place !== null);
  }

  async searchGlobal(keyword: string): Promise<AtlasPlace[]> {
    const pois = await this.queryPlaces(keyword);
    return pois.flatMap((poi) => {
      const category = classifyPlace(poi);
      const place = category && this.convertPoi(poi, category);
      return place ? [place] : [];
    });
  }

  describePlace(place: AtlasPlace): Promise<AtlasPlace> {
    if (place.streetName || typeof AMap.Geocoder !== "function") return Promise.resolve(place);
    const cached = this.resolvedAddresses.get(place.id);
    if (cached) return cached;

    const lookup = new Promise<AtlasPlace>((resolve) => {
      const timer = window.setTimeout(() => {
        this.resolvedAddresses.delete(place.id);
        resolve(place);
      }, 8500);
      new AMap.Geocoder({ city: "深圳" }).getAddress([place.location.lng, place.location.lat], (status, response) => {
        window.clearTimeout(timer);
        const component = response.regeocode?.addressComponent;
        const districtName = component?.district || place.districtName;
        const streetName = component?.township || undefined;
        if (status !== "complete" || !districtName) {
          this.resolvedAddresses.delete(place.id);
          resolve(place);
          return;
        }
        let rest = place.address.replace(/^(广东省)?深圳市/, "");
        if (place.districtName && rest.startsWith(place.districtName)) rest = rest.slice(place.districtName.length);
        if (rest.startsWith(districtName)) rest = rest.slice(districtName.length);
        const streetPrefix = streetName && !rest.startsWith(streetName) ? streetName : "";
        resolve({ ...place, districtName, streetName, address: `深圳市${districtName}${streetPrefix}${rest || place.name}` });
      });
    });
    this.resolvedAddresses.set(place.id, lookup);
    return lookup;
  }

  async locateMetroStation(station: string): Promise<AtlasPlace | null> {
    const name = station.replace(/(?:地铁)?站$/, "");
    const normalize = (value: string) => value.normalize("NFKC").replace(/[\s()·-]/g, "").toUpperCase();
    const prefix = normalize(name);
    const isExit = (poi: AMap.Poi) => {
      if (poi.typecode !== "150501" && !poi.type.includes("出入口")) return false;
      const label = normalize(poi.name).replace(/^深圳地铁/, "");
      if (!label.startsWith(prefix)) return false;
      return /^(?:地铁)?站?[A-Z][0-9]?(?:出入口|出口|口)$/.test(label.slice(prefix.length));
    };
    const results = await this.queryPlaces(`${name}地铁站A口`, { types: "150501", pageSize: 12 }).catch(() => []);
    const exit = results.find(isExit) ??
      (await this.queryPlaces(`${name}地铁站`, { types: "150501", pageSize: 20 }).catch(() => [])).find(isExit);
    if (exit) return this.convertPoi(exit, "地铁站");
    const stations = await this.queryPlaces(`${name}地铁站`, { types: "150500", pageSize: 15 });
    const exact = stations.find((poi) => classifyPlace(poi) === "地铁站" && [prefix, `${prefix}站`, `${prefix}地铁站`].includes(normalize(poi.name)));
    return exact ? this.convertPoi(exact, "地铁站") : null;
  }

  async locateCurated(curated: CuratedPlace): Promise<AtlasPlace | null> {
    const district = DISTRICT_BY_ID.get(curated.districtId);
    const aliases = [curated.name, ...curated.aliases];
    const districtMatches = (place: AtlasPlace) => !district || !place.districtName || place.districtName === district.name;
    const keyword = curated.requiredStreet ? `${curated.requiredStreet}${curated.name}` : curated.name;
    const pois = await this.queryPlaces(keyword);
    const matches = pois.filter((poi) => aliases.includes(poi.name));
    const landmarks = matches.length || curated.requiredStreet
      ? matches
      : pois.filter((poi) => poi.name.includes(curated.name) && classifyPlace(poi) === curated.category);
    for (const poi of landmarks.slice(0, 3)) {
      const place = this.convertPoi(poi, curated.category);
      if (!place || !districtMatches(place)) continue;
      const resolved = await this.describePlace(place);
      if (!districtMatches(resolved)) continue;
      if (!curated.requiredStreet || curated.requiredStreet === resolved.streetName) return resolved;
    }
    return null;
  }

  async locateStreet(district: District, street: Street): Promise<AtlasPlace | null> {
    const streetBase = street.name.replace("街道", "");
    const results = await this.searchPlaces(`${district.name}${street.name}办事处`, "政务设施");
    const districtShortName = district.name.replace(/区|新区/g, "");
    return results.find((place) => place.name.includes(streetBase) && (!place.districtName || !districtShortName || place.districtName.includes(districtShortName)))
      ?? results.find((place) => place.name.includes(streetBase))
      ?? null;
  }

  flyToPlace(place: AtlasPlace): void {
    this.selectionMarker?.setMap(null);
    this.selectedPlaceId = place.id;
    this.selectionMarker = new AMap.Marker({
      position: [place.location.lng, place.location.lat],
      content: createMarkerElement(place, true),
      title: place.name,
      anchor: "bottom-center",
      zIndex: 120,
    });
    this.map.add(this.selectionMarker);
    const zoom = Math.max(this.getZoom(), place.category === "地铁站" ? 17.2 : 15.8);
    this.map.setZoomAndCenter(zoom, [place.location.lng, place.location.lat], false, 650);
    if (this.is3D) this.map.setPitch(this.preferredPitch(), false, 550);
  }

  async syncViewportPlaces(layers: Record<LayerId, boolean>): Promise<Partial<Record<LayerId, number>> | null> {
    const request = ++this.viewportRequest;
    const zoom = this.getZoom();
    const bounds = this.map.getBounds();
    const center = this.map.getCenter();
    const heading: AMap.LngLatTuple = [center.getLng(), center.getLat()];
    const northEast = bounds.getNorthEast();
    const radius = Math.round(Math.max(200, Math.min(5000, straightLineDistance(
      { lng: heading[0], lat: heading[1] },
      { lng: northEast.getLng(), lat: northEast.getLat() },
    ))));
    const counts: Partial<Record<LayerId, number>> = {};
    const definitions = LAYER_DEFINITIONS.filter(({ id, poiTypes, minZoom }) => {
      if (!poiTypes || !layers[id]) return false;
      counts[id] = zoom >= minZoom ? 0 : -1;
      return zoom >= minZoom;
    });
    const groups: LayerId[][] = [
      ["metro", "railway", "malls", "business"],
      ["residential", "villages"],
      ["offices", "banks", "kindergartens", "schools", "government", "police", "parks", "hospitals"],
    ];
    const results = await Promise.all(groups.map((ids) => {
      const types = definitions.filter(({ id }) => ids.includes(id)).map(({ poiTypes }) => poiTypes).join("|");
      return types ? this.queryPlaces("", { types, center: heading, radius, pageSize: 45 }).catch(() => []) : [];
    }));
    if (request !== this.viewportRequest) return null;

    this.markers.forEach((marker) => marker.setMap(null));
    this.markers = [];
    const names = new Set<string>();
    const shown: { x: number; y: number }[] = [];
    const { clientWidth, clientHeight } = this.container;
    // Interleave the query groups so a dense housing cluster cannot hide all the public landmarks.
    const maxGroupSize = Math.max(...results.map((group) => group.length));
    for (let index = 0; index < maxGroupSize && this.markers.length < 24; index += 1) {
      for (const group of results) {
        const poi = group[index];
        if (!poi || this.markers.length >= 24) continue;
        const category = classifyPlace(poi);
        const definition = definitions.find((layer) => layer.category === category ||
          (layer.id === "offices" && category === "企业总部"));
        if (!category || !definition) continue;
        const place = this.convertPoi(poi, category);
        if (!place || place.id === this.selectedPlaceId) continue;
        const position: AMap.LngLatTuple = [place.location.lng, place.location.lat];
        if (!bounds.contains(position)) continue;
        const name = `${place.category}:${place.name.replace(/地铁站|购物中心|\s/g, "")}`;
        if (names.has(name)) continue;

        const point = this.map.lngLatToContainer(position);
        const x = point.getX();
        const y = point.getY();
        if (x < 63 || x > clientWidth - 63 || y < 55 || y > clientHeight - 36) continue;
        if (shown.some((item) => Math.abs(item.x - x) < 99 && Math.abs(item.y - y) < 28)) continue;

        shown.push({ x, y });
        names.add(name);
        counts[definition.id] = (counts[definition.id] ?? 0) + 1;
        const marker = new AMap.Marker({
          position, content: createMarkerElement(place), anchor: "bottom-center", zIndex: 60,
        });
        marker.on("click", () => this.onPlaceSelect(place));
        this.map.add(marker);
        this.markers.push(marker);
      }
    }
    return counts;
  }

  async searchNearby(origin: AtlasPlace, keyword: string, category: PlaceCategory, radius = 1500): Promise<NearbyPlace[]> {
    const types = LAYER_DEFINITIONS.find((definition) => definition.category === category)?.poiTypes;
    const pois = await this.queryPlaces(keyword, {
      types, center: [origin.location.lng, origin.location.lat], radius,
    });
    return pois
      .filter((poi) => classifyPlace(poi) === category)
      .map((poi) => this.convertPoi(poi, category))
      .filter((place): place is AtlasPlace => place !== null && place.id !== origin.id)
      .map((place) => ({ place, straightLineDistance: straightLineDistance(origin.location, place.location) }))
      .sort((a, b) => a.straightLineDistance - b.straightLineDistance)
      .slice(0, 6);
  }

  destroy(): void {
    this.viewportRequest += 1;
    this.markers.forEach((marker) => marker.setMap(null));
    this.selectionMarker?.setMap(null);
    this.map.destroy();
  }
}

declare namespace AMap {
  type LngLatTuple = [number, number];

  interface MapEvent {
    type?: string;
    lnglat?: LngLat;
  }

  class LngLat {
    getLng(): number;
    getLat(): number;
  }

  interface MapOptions {
    center: LngLatTuple;
    zoom: number;
    viewMode: "2D" | "3D";
    pitch: number;
    rotation: number;
    mapStyle: string;
    features: string[];
    showLabel: boolean;
    resizeEnable: boolean;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    on(event: string, handler: (event: MapEvent) => void): void;
    setZoomAndCenter(zoom: number, center: LngLatTuple, immediately?: boolean, duration?: number): void;
    setCenter(center: LngLatTuple, immediately?: boolean, duration?: number): void;
    setZoom(zoom: number, immediately?: boolean, duration?: number): void;
    setPitch(pitch: number, immediately?: boolean, duration?: number): void;
    setRotation(rotation: number, immediately?: boolean, duration?: number): void;
    setViewMode(mode: "2D" | "3D"): void;
    setMapStyle(style: string): void;
    setFeatures(features: string[]): void;
    setFitView(overlays?: Polygon[], immediately?: boolean, avoid?: number[], maxZoom?: number): void;
    getZoom(): number;
    add(overlay: Marker | Polygon | TileLayer.Satellite): void;
    remove(overlay: Marker | Polygon | TileLayer.Satellite | Array<Marker | Polygon>): void;
    destroy(): void;
  }

  interface District {
    adcode: string;
    name: string;
    center?: LngLat;
    boundaries?: LngLat[][];
  }

  interface DistrictSearchResult {
    info?: string;
    districts?: District[];
  }

  class DistrictSearch {
    constructor(options: { level: string; extensions: string; subdistrict: number });
    search(keyword: string, callback: (status: string, result: DistrictSearchResult) => void): void;
  }

  interface Poi {
    id: string;
    name: string;
    type: string;
    address: string;
    location: LngLat;
    adname?: string;
    tel?: string;
  }

  interface PlaceSearchResult {
    info?: string;
    poiList?: { pois: Poi[] };
  }

  class PlaceSearch {
    constructor(options: { city: string; citylimit: boolean; pageSize: number; extensions?: string });
    search(keyword: string, callback: (status: string, result: PlaceSearchResult) => void): void;
    searchNearBy(keyword: string, center: LngLatTuple, radius: number, callback: (status: string, result: PlaceSearchResult) => void): void;
  }

  function plugin(name: "AMap.PlaceSearch", callback: () => void): void;

  interface MarkerOptions {
    position: LngLatTuple;
    title?: string;
    content?: string | HTMLElement;
    zIndex?: number;
    anchor?: string;
  }

  class Marker {
    constructor(options: MarkerOptions);
    on(event: string, handler: (event: MapEvent) => void): void;
    setMap(map: Map | null): void;
  }

  interface PolygonOptions {
    path: LngLat[][];
    strokeColor: string;
    strokeWeight: number;
    strokeOpacity?: number;
    fillColor: string;
    fillOpacity: number;
    bubble: boolean;
    cursor: string;
    zIndex: number;
  }

  class Polygon {
    constructor(options: PolygonOptions);
    on(event: string, handler: (event: MapEvent) => void): void;
    setOptions(options: Partial<PolygonOptions>): void;
    setMap(map: Map | null): void;
  }

  namespace TileLayer {
    class Satellite {
      setMap(map: Map | null): void;
    }
  }

  class Scale {
    setMap(map: Map | null): void;
  }

  function plugin(name: "AMap.Scale", callback: () => void): void;
}

interface Window {
  AMap?: typeof AMap;
  _AMapSecurityConfig?: { serviceHost: string } | { securityJsCode: string };
  __shenzhenAtlasAMapLoaded?: () => void;
}

export type DistrictKind = "行政区" | "功能区";

export interface DataSource {
  name: string;
  url?: string;
  publishedAt?: string;
}

export interface Coordinate {
  lng: number;
  lat: number;
}

export interface Street {
  id: string;
  name: string;
  districtId: string;
  /** 首期没有批量可靠的街道边界，绝不能使用示意多边形冒充。 */
  boundaryStatus: "精确边界数据暂缺";
}

export interface District {
  id: string;
  name: string;
  adcode: string | null;
  kind: DistrictKind;
  color: string;
  streets: Street[];
  source: DataSource;
}

export type PlaceCategory =
  | "商圈"
  | "购物中心"
  | "办公楼"
  | "企业总部"
  | "银行"
  | "幼儿园"
  | "城中村"
  | "住宅小区"
  | "地铁站"
  | "铁路车站"
  | "派出所"
  | "政务设施"
  | "学校"
  | "医院"
  | "公园"
  | "其他地点";

export type LayerId =
  | "districts"
  | "business"
  | "malls"
  | "offices"
  | "banks"
  | "kindergartens"
  | "villages"
  | "residential"
  | "metro"
  | "railway"
  | "police"
  | "government"
  | "schools"
  | "hospitals"
  | "parks"
  | "buildings";

export interface LayerDefinition {
  id: LayerId;
  label: string;
  poiTypes?: string;
  category?: PlaceCategory;
  description: string;
  minZoom: number;
}

export interface CuratedPlace {
  id: string;
  name: string;
  aliases: string[];
  category: PlaceCategory;
  districtId: string;
  areaName?: string;
}

/** 业务组件只使用该统一模型，不直接依赖高德原始 POI 结构。 */
export interface AtlasPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  districtName: string;
  streetName?: string;
  communityName?: string;
  location: Coordinate;
  coordinateSystem: "GCJ-02";
  source: DataSource;
  updatedAt: string;
  confidence: "地图服务检索" | "官方资料" | "待核实";
  rawType?: string;
  phone?: string;
}

export interface NearbyPlace {
  place: AtlasPlace;
  /** 球面直线距离，不是步行或驾车路线距离。 */
  straightLineDistance: number;
}

export interface TransactionPrice {
  id: string;
  targetId: string;
  targetName: string;
  propertyType: "普通商品住宅";
  price: number;
  unit: "万元/平方米";
  priceType: "实际成交均价";
  periodStart: string;
  periodEnd: string;
  publishedAt: string;
  source: DataSource;
  sampleSize?: number;
  isHistorical: boolean;
}

export type ExplorationStatus = "已浏览" | "已了解";

export interface ExplorationRecord {
  name: string;
  category: string;
  districtName?: string;
  place?: AtlasPlace;
  status: ExplorationStatus;
  viewedAt: string;
  knownAt?: string;
  favorite: boolean;
  wishlist: boolean;
}

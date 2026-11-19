import type { LayerDefinition, LayerId } from "@/types/atlas";

export const LAYER_DEFINITIONS: LayerDefinition[] = [
  { id: "districts", label: "行政区边界", description: "高德行政区查询返回的区级边界；大鹏新区按可用结果展示", minZoom: 0 },
  { id: "business", label: "商圈", keyword: "商圈", category: "商圈", description: "地图服务当前检索结果，非完整商圈目录", minZoom: 10 },
  { id: "malls", label: "购物中心", keyword: "购物中心", category: "购物中心", description: "按当前区域检索购物中心", minZoom: 10 },
  { id: "villages", label: "城中村", keyword: "村", category: "城中村", description: "地名检索结果，不等于经核实的完整城中村清单", minZoom: 12 },
  { id: "residential", label: "住宅小区", keyword: "住宅小区", category: "住宅小区", description: "按当前区域检索，未区分全部物业细类", minZoom: 13 },
  { id: "metro", label: "地铁站", keyword: "地铁站", category: "地铁站", description: "运营与规划状态需另经官方资料核验", minZoom: 10 },
  { id: "railway", label: "铁路车站", keyword: "火车站", category: "铁路车站", description: "车站类型以铁路官方信息为准", minZoom: 9 },
  { id: "police", label: "派出所", keyword: "派出所", category: "派出所", description: "按当前区域检索", minZoom: 12 },
  { id: "government", label: "政务设施", keyword: "政务服务中心", category: "政务设施", description: "按当前区域检索", minZoom: 12 },
  { id: "schools", label: "学校", keyword: "学校", category: "学校", description: "按当前区域检索，非教育机构完整名录", minZoom: 13 },
  { id: "hospitals", label: "医院", keyword: "医院", category: "医院", description: "按当前区域检索", minZoom: 11 },
  { id: "parks", label: "公园", keyword: "公园", category: "公园", description: "按当前区域检索", minZoom: 10 },
  { id: "prices", label: "成交均价", description: "仅展示有来源、时间和物业类型的真实成交记录", minZoom: 9 },
  { id: "buildings", label: "3D 建筑", description: "由高德地图楼块能力提供，不自行编造建筑高度", minZoom: 0 },
];

export const DEFAULT_LAYERS: Record<LayerId, boolean> = {
  districts: true,
  business: false,
  malls: true,
  villages: false,
  residential: false,
  metro: false,
  railway: true,
  police: false,
  government: false,
  schools: false,
  hospitals: false,
  parks: false,
  prices: false,
  buildings: true,
};

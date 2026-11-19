import type { LayerDefinition, LayerId } from "@/types/atlas";

export const LAYER_DEFINITIONS: LayerDefinition[] = [
  { id: "districts", label: "行政区边界", description: "高德返回的区级边界", minZoom: 0 },
  { id: "business", label: "商圈", poiTypes: "190600", category: "商圈", description: "商业街与片区", minZoom: 13 },
  { id: "malls", label: "购物中心", poiTypes: "060101", category: "购物中心", description: "大型商场整体", minZoom: 12 },
  { id: "villages", label: "城中村", poiTypes: "190108|190109|120300", category: "城中村", description: "村庄与新村地名", minZoom: 14 },
  { id: "residential", label: "住宅小区", poiTypes: "120302", category: "住宅小区", description: "按小区整体显示", minZoom: 14 },
  { id: "offices", label: "写字楼与总部", poiTypes: "120200|170100", category: "办公楼", description: "具名办公楼与企业总部", minZoom: 14 },
  { id: "banks", label: "银行", poiTypes: "160100", category: "银行", description: "银行网点与银行大厦", minZoom: 15 },
  { id: "metro", label: "地铁站", poiTypes: "150500", category: "地铁站", description: "同一车站归并显示", minZoom: 12 },
  { id: "railway", label: "铁路车站", poiTypes: "150200", category: "铁路车站", description: "铁路客运站", minZoom: 10 },
  { id: "police", label: "派出所", poiTypes: "130501", category: "派出所", description: "公安派出所", minZoom: 15 },
  { id: "government", label: "政务设施", poiTypes: "130100|130500", category: "政务设施", description: "政务、税务和公积金服务等", minZoom: 14 },
  { id: "kindergartens", label: "幼儿园", poiTypes: "141204", category: "幼儿园", description: "幼儿园园区", minZoom: 15 },
  { id: "schools", label: "学校", poiTypes: "141201|141202|141203", category: "学校", description: "中小学及高校", minZoom: 14 },
  { id: "hospitals", label: "医院", poiTypes: "090100", category: "医院", description: "综合医院", minZoom: 14 },
  { id: "parks", label: "公园", poiTypes: "110101", category: "公园", description: "公园整体", minZoom: 13 },
  { id: "buildings", label: "3D 建筑", description: "使用高德楼块高度，卫星模式优先保留影像细节", minZoom: 0 },
];

export const DEFAULT_LAYERS: Record<LayerId, boolean> = {
  districts: true,
  business: false,
  malls: true,
  villages: true,
  residential: true,
  offices: true,
  banks: true,
  kindergartens: true,
  metro: true,
  railway: true,
  police: false,
  government: true,
  schools: false,
  hospitals: false,
  parks: true,
  buildings: true,
};

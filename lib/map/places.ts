import type { PlaceCategory } from "@/types/atlas";

export const PLACE_BADGES: Record<PlaceCategory, { glyph: string; color: string }> = {
  "购物中心": { glyph: "商", color: "#ffca7b" },
  "商圈": { glyph: "商", color: "#ffca7b" },
  "办公楼": { glyph: "楼", color: "#9cd1fb" },
  "企业总部": { glyph: "企", color: "#bee5ff" },
  "银行": { glyph: "银", color: "#e2c0fb" },
  "幼儿园": { glyph: "幼", color: "#ffc4d5" },
  "城中村": { glyph: "村", color: "#e7cd9a" },
  "住宅小区": { glyph: "居", color: "#a6e9c3" },
  "地铁站": { glyph: "铁", color: "#6ee8f3" },
  "铁路车站": { glyph: "铁", color: "#9dc4ff" },
  "派出所": { glyph: "警", color: "#b9c7ff" },
  "政务设施": { glyph: "政", color: "#c8c5ff" },
  "学校": { glyph: "学", color: "#ffc4d5" },
  "医院": { glyph: "医", color: "#ffb3ac" },
  "公园": { glyph: "园", color: "#c3e8a0" },
  "其他地点": { glyph: "点", color: "#c9dbd7" },
};

export function classifyPlace(poi: Pick<AMap.Poi, "name" | "type" | "typecode">): PlaceCategory | null {
  const { name, type = "", typecode = "" } = poi;
  const codes = typecode.split("|");
  const code = codes[0] ?? "";
  const namedTower = /(?:大厦|写字楼|中心|广场|总部)[\s·-]*[A-Z][座栋]$/i.test(name);
  if ((!namedTower && /(?:[A-Z]?\d+[A-Z]?|[一二三四五六七八九十百]+)(?:号楼|栋|座|单元)(?:\s*[A-Z][栋座])?$|^[A-Z][栋座]$/i.test(name)) ||
    /(?:门店|维修|烧鹅|餐馆|咖啡|便利店|零食店|小卖部|停车场|服务台|自助银行|ATM|客运上车点|(?:店|酒店|公寓|宿舍)[)）]?$)/i.test(name)) return null;

  if (codes.includes("060101") || /购物中心/.test(type)) return "购物中心";
  if (code === "150500" || /;地铁站;地铁站/.test(type)) return "地铁站";
  if (code === "150501" || /;地铁站;出入口/.test(type)) return null;
  if (/^(150200|150203)$/.test(code) || /火车站;火车站/.test(type)) return "铁路车站";
  if ((code === "190108" || code === "190109" || /村庄级地名|村组级地名/.test(type) ||
    /(?:新[一二三四五六七八九十1-9]?村|老村|旧村|围村)$/.test(name)) && /村/.test(name)) return "城中村";
  if (!/社区$|公寓(?:[A-Z]座)?$|[路街道巷]\d+(?:-\d+)?号/i.test(name) && (codes.includes("120302") || /住宅小区/.test(type))) return "住宅小区";
  if ((/^17|^1202|^1601/.test(code) || /公司企业|楼宇|银行/.test(type)) &&
    /总部(?:大厦|基地|中心|园区|办公楼)?(?:[\s·-]*[A-Z]座)?$|总行(?:大厦)?$/.test(name)) return "企业总部";
  if (/^1601/.test(code) || /金融保险服务;银行;/.test(type)) return "银行";
  if (/税务局|公积金(?:管理)?中心|公积金大厦|政务服务中心|行政服务中心|街道办事处|社区工作站|居民委员会|社区居委会/.test(name) ||
    /^1301/.test(code) || /政府机关/.test(type)) return "政务设施";
  if (/派出所$/.test(name) && (code === "130501" || /公安警察|公检法机构/.test(type))) return "派出所";
  if (code === "141204" || /;幼儿园/.test(type)) return "幼儿园";
  if (/^14120[0-36]$/.test(code) || /;学校;(?:小学|中学|高等院校)/.test(type)) return "学校";
  if ((/^1202/.test(code) || /;楼宇;/.test(type)) && /大厦|写字楼|办公楼|金融中心|商务中心|研发中心|科技大楼|[A-Z]座$/i.test(name)) return "办公楼";
  if (code === "090100" || /;综合医院;综合医院/.test(type)) return "医院";
  if (code === "110101" || /;公园广场;公园/.test(type)) return "公园";
  if (/商圈/.test(type) && /商圈|商业街/.test(name)) return "商圈";
  return null;
}

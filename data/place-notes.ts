import type { PlaceCategory } from "@/types/atlas";

const profiles = [
  {
    names: ["宝安大仟里", "大仟里购物中心", "宝安大仟里购物中心"],
    category: "购物中心",
    address: "深圳市宝安区西乡街道宝安大道与海城路交汇处",
    summary: "宝安西乡的综合购物中心，集合购物、餐饮和休闲娱乐，可从地铁1号线坪洲站A口到达。",
    source: { name: "深圳前海管理局", url: "https://qh.sz.gov.cn/sygnan/qhzx/zthd_1/qhgnz/shzqh/xf/sqjd/content/post_12073733.html" },
  },
  {
    names: ["麻布新村", "麻布新村(西乡街道)"],
    category: "城中村",
    address: "深圳市宝安区西乡街道麻布新村",
    summary: "坪洲地铁站B口附近的居民村落，位于新湖路一带。",
    source: { name: "乐有家小区资料", url: "https://shenzhen.leyoujia.com/xq/detail/14789.html" },
    villagePrice: { sqm: 14_847, month: "2026-10", url: "https://mfang.58.com/sz/xinfang/xq102413242/fangjia/" },
  },
  {
    names: ["高树围新村", "共乐高树围新村", "高树围村"],
    category: "城中村",
    address: "深圳市宝安区西乡街道高树围新村",
    summary: "宝安大道附近的西乡居民村落。平台资料将其物业类型列为自建房。",
    source: { name: "58同城爱房小区资料", url: "https://mfang.58.com/sz/xinfang/xq103124471/fangjia/" },
    villagePrice: { sqm: 18_584, month: "2026-11", url: "https://mfang.58.com/sz/xinfang/xq103124471/fangjia/" },
  },
];

const categoryIntros: Record<PlaceCategory, string> = {
  "住宅小区": "住宅小区。下方房价参考以最近一笔可核实的单套公开成交折算。",
  "购物中心": "综合商业场所，标注对应商场整体。",
  "商圈": "商业活动相对集中的街区，可在地图上浏览周边主要地标。",
  "城中村": "城市中的村落地名，定位对应村落整体。",
  "办公楼": "具名商务建筑，常见用途为办公及企业入驻。",
  "企业总部": "地图名录中标注为总部、总部园区或总行的办公地点。",
  "银行": "银行营业网点或银行办公建筑。",
  "政务设施": "政府机构或公共服务设施。",
  "派出所": "辖区公安派出所。",
  "地铁站": "深圳地铁站点或对应的站外出入口。",
  "铁路车站": "铁路客运站。",
  "幼儿园": "学前教育园区。",
  "学校": "学校或高校校园。",
  "医院": "医疗机构。",
  "公园": "公共游憩场所。",
  "其他地点": "高德地图名录中的地点。",
};

export function knownPlaceProfile(name: string, districtName: string, category: string) {
  if (!["宝安", "宝安区"].includes(districtName)) return undefined;
  const key = name.normalize("NFKC");
  return profiles.find((profile) => profile.category === category && profile.names.includes(key));
}

export function placeIntro(category: string) {
  return categoryIntros[category as PlaceCategory];
}

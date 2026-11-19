import type { CuratedPlace } from "@/types/atlas";

/**
 * 这里只保存真实地名与待检索线索，不手写坐标、简介或楼高。
 * 用户点选后由地图服务实时解析位置，结果不代表完整 POI 目录。
 */
export const CURATED_PLACES: CuratedPlace[] = [
  { id: "mall-baoan-daqianli", name: "宝安大仟里", aliases: ["大仟里", "大千里", "坪洲大仟里"], category: "购物中心", districtId: "baoan", areaName: "西乡" },
  { id: "village-mabu", name: "麻布新村", aliases: ["麻布村"], category: "城中村", districtId: "baoan", areaName: "西乡" },
  { id: "village-gaoshuwei", name: "高树围新村", aliases: ["高树围村", "共乐高树围新村"], category: "城中村", districtId: "baoan", areaName: "西乡" },
  { id: "estate-jingang", name: "金港华庭", aliases: [], category: "住宅小区", districtId: "baoan", areaName: "西乡" },
  { id: "estate-xiangtiwan", name: "香缇湾花园", aliases: ["中熙香缇湾", "香缇湾"], category: "住宅小区", districtId: "baoan", areaName: "西乡" },
  { id: "estate-zhaoshangguoling", name: "招商果岭", aliases: ["招商果岭花园"], category: "住宅小区", districtId: "baoan", areaName: "西乡" },
  { id: "mall-yifangcheng", name: "壹方城", aliases: ["前海壹方城"], category: "购物中心", districtId: "baoan", areaName: "宝安中心" },
  { id: "mall-haiya", name: "海雅缤纷城", aliases: [], category: "购物中心", districtId: "baoan", areaName: "新安" },
  { id: "mall-mixc-world", name: "万象天地", aliases: ["深圳万象天地"], category: "购物中心", districtId: "nanshan", areaName: "科技园" },
  { id: "mall-sz-bay-mixc", name: "深圳湾万象城", aliases: [], category: "购物中心", districtId: "nanshan", areaName: "深圳湾" },
  { id: "mall-coastal-city", name: "海岸城", aliases: ["海岸城购物中心"], category: "购物中心", districtId: "nanshan", areaName: "后海" },
  { id: "mall-coco-park", name: "星河COCO Park", aliases: ["COCO Park", "福田COCO Park"], category: "购物中心", districtId: "futian" },
  { id: "mall-upperhills", name: "深业上城", aliases: [], category: "购物中心", districtId: "futian" },
  { id: "mall-one-avenue", name: "卓悦中心", aliases: ["One Avenue卓悦中心"], category: "购物中心", districtId: "futian" },
  { id: "mall-mixc", name: "深圳万象城", aliases: ["万象城"], category: "购物中心", districtId: "luohu" },
  { id: "biz-baoan-center", name: "宝安中心", aliases: ["宝安中心区"], category: "商圈", districtId: "baoan" },
  { id: "biz-fanshen", name: "翻身", aliases: ["翻身片区"], category: "商圈", districtId: "baoan" },
  { id: "biz-houhai", name: "后海", aliases: ["后海商圈"], category: "商圈", districtId: "nanshan" },
  { id: "biz-kejiyuan", name: "科技园", aliases: ["南山科技园"], category: "商圈", districtId: "nanshan" },
  { id: "biz-huaqiangbei", name: "华强北", aliases: ["华强北商圈"], category: "商圈", districtId: "futian" },
  { id: "biz-dongmen", name: "东门", aliases: ["东门商圈"], category: "商圈", districtId: "luohu" },
  { id: "village-gushu", name: "固戍", aliases: ["固戍社区"], category: "城中村", districtId: "baoan", areaName: "西乡" },
  { id: "village-baishizhou", name: "白石洲", aliases: ["白石洲村"], category: "城中村", districtId: "nanshan" },
  { id: "village-xiasha", name: "下沙村", aliases: ["下沙"], category: "城中村", districtId: "futian" },
  { id: "village-huanggang", name: "皇岗村", aliases: ["皇岗"], category: "城中村", districtId: "futian" },
  { id: "rail-shenzhen-north", name: "深圳北站", aliases: ["深圳北"], category: "铁路车站", districtId: "longhua" },
  { id: "rail-shenzhen", name: "深圳站", aliases: ["罗湖火车站"], category: "铁路车站", districtId: "luohu" },
  { id: "rail-futian", name: "福田站", aliases: ["福田高铁站"], category: "铁路车站", districtId: "futian" },
  { id: "park-shenzhen-bay", name: "深圳湾公园", aliases: [], category: "公园", districtId: "nanshan" },
  { id: "park-lianhuashan", name: "莲花山公园", aliases: ["莲花山"], category: "公园", districtId: "futian" },
];

export const CURATED_PLACE_BY_ID = new Map(CURATED_PLACES.map((place) => [place.id, place]));

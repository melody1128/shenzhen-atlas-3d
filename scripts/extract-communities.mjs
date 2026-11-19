import { readFileSync, writeFileSync } from "node:fs";

/**
 * 从国家统计局《统计用区划代码和城乡划分代码》整理数据（modood/Administrative-divisions-of-China，
 * 来源为官方公开区划资料）中提取深圳市社区（村级）目录，生成 data/communities.ts。
 * 用法：先将 dist/streets.json 与 dist/villages.json 下载到 /tmp。
 */
const streets = JSON.parse(readFileSync("/tmp/streets.json", "utf8"));
const villages = JSON.parse(readFileSync("/tmp/villages.json", "utf8"));

// 深圳市民政局 2026-05-06 官方目录中的 74 个街道（不带“街道”后缀），
// 只保留与其精确匹配的街道，过滤保税区、合作区、机场等非街道功能单元。
const OFFICIAL_STREET_BASES = new Set([
  "南园", "园岭", "福田", "沙头", "香蜜湖", "梅林", "莲花", "华富", "华强北", "福保",
  "桂园", "黄贝", "东门", "翠竹", "南湖", "笋岗", "东湖", "莲塘", "东晓", "清水河",
  "南头", "南山", "沙河", "蛇口", "招商", "粤海", "桃源", "西丽",
  "梅沙", "盐田", "沙头角", "海山",
  "新安", "西乡", "福永", "沙井", "松岗", "石岩", "航城", "福海", "新桥", "燕罗",
  "横岗", "布吉", "平湖", "坪地", "龙岗", "龙城", "坂田", "南湾", "吉华", "园山", "宝龙",
  "龙华", "大浪", "民治", "观澜", "观湖", "福城",
  "坪山", "坑梓", "马峦", "碧岭", "石井", "龙田",
  "公明", "光明", "新湖", "凤凰", "玉塘", "马田",
  "葵涌", "大鹏", "南澳",
]);

const shenzhenStreetCodes = new Map(streets.filter((s) => s.cityCode === "4403").map((s) => [s.code, s.name]));
const shenzhenVillages = villages.filter((v) => v.cityCode === "4403");

const groups = new Map();
let droppedFunctionalEntries = 0;
for (const village of shenzhenVillages) {
  const streetName = shenzhenStreetCodes.get(village.streetCode) ?? "未知街道";
  const baseName = streetName.replace(/街道$/, "");
  if (!OFFICIAL_STREET_BASES.has(baseName)) {
    droppedFunctionalEntries += 1;
    continue;
  }
  if (!groups.has(baseName)) groups.set(baseName, { streetCode: village.streetCode, areaCode: village.areaCode, communities: [] });
  groups.get(baseName).communities.push(village.name);
}

const result = [...groups.entries()].map(([streetName, data]) => ({ streetName, ...data, count: data.communities.length }));
result.sort((a, b) => a.areaCode.localeCompare(b.areaCode) || a.streetName.localeCompare(b.streetName, "zh"));

console.log(`深圳社区（村级）条目：保留 ${result.reduce((sum, item) => sum + item.count, 0)}，过滤非街道功能单元条目 ${droppedFunctionalEntries}`);
console.log(`覆盖官方街道数：${groups.size} / 74`);
const missing = [...OFFICIAL_STREET_BASES].filter((name) => !groups.has(name));
if (missing.length) console.log(`未覆盖街道：${missing.join("、")}`);

const output = `// 由 scripts/extract-communities.mjs 生成，请勿手工修改。
// 来源：国家统计局《统计用区划代码和城乡划分代码》整理数据（modood/Administrative-divisions-of-China 仓库），
// 统计口径年份以仓库发布为准（2023 年统计用区划代码，社区层后续调整未自动同步）。
// 注意：部分社区名称含"居委会/社区居委会"后缀；社区数量与最新基层治理调整可能存在差异，界面上标注数据年份。
export const COMMUNITY_SOURCE = {
  name: "国家统计局统计用区划代码（社区/村级）· modood 仓库整理",
  url: "https://github.com/modood/Administrative-divisions-of-China",
  statisticsYear: "2023",
};

export interface StreetCommunities {
  /** 与 data/districts.ts 街道名称匹配（不含"街道"后缀）。 */
  streetName: string;
  districtCode: string;
  communities: string[];
}

export const COMMUNITIES_BY_STREET: StreetCommunities[] = ${JSON.stringify(result.map(({ streetName, areaCode, communities }) => ({ streetName, districtCode: areaCode, communities })), null, 2)};

/** 根据街道名（可含“街道”后缀）查询社区列表；匹配失败返回 null（不猜测归属）。 */
export function communitiesOfStreet(streetFullName: string): string[] | null {
  const base = streetFullName.replace(/街道$/, "");
  const entry = COMMUNITIES_BY_STREET.find((item) => item.streetName === base);
  return entry ? entry.communities : null;
}
`;
writeFileSync(new URL("../data/communities.ts", import.meta.url), output);
console.log("已生成 data/communities.ts");

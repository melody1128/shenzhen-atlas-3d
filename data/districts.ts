import type { District } from "@/types/atlas";

const OFFICIAL_SOURCE = {
  name: "深圳市民政局《深圳市行政区划信息概况》",
  url: "https://mzj.sz.gov.cn/szmz/pc/bmxx/cyfwzy/content/post_2949169.html",
  publishedAt: "2026-05-06",
};

function createDistrict(
  id: string,
  name: string,
  adcode: string | null,
  kind: "行政区" | "功能区",
  color: string,
  streetNames: string[],
): District {
  return {
    id,
    name,
    adcode,
    kind,
    color,
    streets: streetNames.map((streetName, index) => ({
      id: `${id}-${String(index + 1).padStart(2, "0")}`,
      name: `${streetName}街道`,
      districtId: id,
      boundaryStatus: "精确边界数据暂缺",
    })),
    source: OFFICIAL_SOURCE,
  };
}

/** 与深圳市民政局 2026-05-06 公布的 74 个街道目录逐项对应。 */
export const DISTRICTS: District[] = [
  createDistrict("futian", "福田区", "440304", "行政区", "#82b8aa", ["南园", "园岭", "福田", "沙头", "香蜜湖", "梅林", "莲花", "华富", "华强北", "福保"]),
  createDistrict("luohu", "罗湖区", "440303", "行政区", "#c7a27c", ["桂园", "黄贝", "东门", "翠竹", "南湖", "笋岗", "东湖", "莲塘", "东晓", "清水河"]),
  createDistrict("nanshan", "南山区", "440305", "行政区", "#7da6c9", ["南头", "南山", "沙河", "蛇口", "招商", "粤海", "桃源", "西丽"]),
  createDistrict("yantian", "盐田区", "440308", "行政区", "#70b7bd", ["梅沙", "盐田", "沙头角", "海山"]),
  createDistrict("baoan", "宝安区", "440306", "行政区", "#b7a0c7", ["新安", "西乡", "福永", "沙井", "松岗", "石岩", "航城", "福海", "新桥", "燕罗"]),
  createDistrict("longgang", "龙岗区", "440307", "行政区", "#94ae7c", ["横岗", "布吉", "平湖", "坪地", "龙岗", "龙城", "坂田", "南湾", "吉华", "园山", "宝龙"]),
  createDistrict("longhua", "龙华区", "440309", "行政区", "#c38f91", ["龙华", "大浪", "民治", "观澜", "观湖", "福城"]),
  createDistrict("pingshan", "坪山区", "440310", "行政区", "#c1ae72", ["坪山", "坑梓", "马峦", "碧岭", "石井", "龙田"]),
  createDistrict("guangming", "光明区", "440311", "行政区", "#84b29a", ["公明", "光明", "新湖", "凤凰", "玉塘", "马田"]),
  createDistrict("dapeng", "大鹏新区", null, "功能区", "#759fab", ["葵涌", "大鹏", "南澳"]),
];

export const DISTRICT_BY_ID = new Map(DISTRICTS.map((district) => [district.id, district]));
export const ALL_STREETS = DISTRICTS.flatMap((district) => district.streets);
export const STREET_BY_ID = new Map(ALL_STREETS.map((street) => [street.id, street]));

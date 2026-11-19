import type { TransactionPrice } from "@/types/atlas";

/**
 * 静态房价快照：2026-11-18 一次性采集，之后不做自动更新。
 * 全市口径与区/板块口径来自不同机构，必须分别展示，禁止混用或互相推导。
 *
 * 来源一（全市）：乐有家研究中心 / 深圳贝壳研究院，网签成交口径，
 *   被深圳政府在线官网转载 https://www.sz.gov.cn/cn/xxgk/zfxxgj/zwdt/content/post_13051300.html
 * 来源二（区/板块）：普睿数智 2026 年 10 月月报（二手房住宅普睿口径，统计 2026.10.1–10.31），
 *   微信公众号「PUi普睿深圳」发布。板块价格是片区参考值，不等于街道全域均价。
 * 历史月份：2026-04（深圳新闻网转深圳市房地产业协会）、2026-05（深圳政府在线转深房协）、
 *   2026-09（深圳市房地产信息平台官方月报，商置网转引）。
 * 小区级成交价：暂无免费且可核验来源，全部保持缺失，不编造。
 */
const CITY_SOURCE = { name: "乐有家研究中心 / 深圳贝壳研究院 · 网签成交口径", url: "https://www.sz.gov.cn/cn/xxgk/zfxxgj/zwdt/content/post_13051300.html", publishedAt: "2026-11" };
const AREA_SOURCE = { name: "普睿数智 2026年10月月报 · 二手住宅普睿口径", url: "https://www.toutiao.com/article/7707200533580333631", publishedAt: "2026-10-31" };

function cityRecord(periodEnd: string, price: number, sampleSize: number, isHistorical: boolean): TransactionPrice {
  return { id: `city-${periodEnd}`, targetId: "shenzhen", targetName: "深圳全市", propertyType: "普通商品住宅", price, unit: "万元/平方米", priceType: "实际成交均价", periodStart: periodEnd.slice(0, 8) + "01", periodEnd, publishedAt: isHistorical ? "2026" : "2026-11", source: CITY_SOURCE, sampleSize, isHistorical };
}

function areaRecord(targetId: string, targetName: string, priceYuanPerSqm: number): TransactionPrice {
  return {
    id: `area-${targetId}-202610`,
    targetId,
    targetName,
    propertyType: "普通商品住宅",
    price: priceYuanPerSqm / 10_000,
    unit: "万元/平方米",
    priceType: "实际成交均价",
    periodStart: "2026-10-01",
    periodEnd: "2026-10-31",
    publishedAt: "2026-11",
    source: AREA_SOURCE,
    isHistorical: false,
  };
}

export const TRANSACTION_PRICES: TransactionPrice[] = [
  // 全市（网签成交口径，样本为当月网签套数）
  cityRecord("2026-10-31", 5.64, 4361, false),
  cityRecord("2026-09-30", 5.83, 4455, true),
  cityRecord("2026-05-31", 6.08, 5534, true),
  cityRecord("2026-04-30", 5.80, 5644, true),

  // 区级（普睿数智 2026-10，元/㎡ → 万元/㎡）
  areaRecord("nanshan", "南山区", 62369),
  areaRecord("futian", "福田区", 47617),
  areaRecord("longhua", "龙华区", 44154),
  areaRecord("baoan", "宝安区", 41205),
  areaRecord("guangming", "光明区", 32939),
  areaRecord("luohu", "罗湖区", 29568),
  areaRecord("longgang", "龙岗区", 27353),
  areaRecord("yantian", "盐田区", 24403),
  areaRecord("pingshan", "坪山区", 20016),
  areaRecord("dapeng", "大鹏新区", 16324),

  // 重点街道 / 板块（普睿数智 2026-10 板块口径；与街道全域不完全重合，仅作片区参考）
  areaRecord("biz-baoan-center", "宝安中心区板块", 63093),
  areaRecord("biz-kejiyuan", "高新板块（科技园）", 75779),
  areaRecord("biz-houhai", "后海一带（粤海板块参考）", 63677),
  areaRecord("baoan-01", "新安板块", 40663),
  areaRecord("baoan-02", "西乡板块", 42737),
  areaRecord("nanshan-04", "蛇口板块", 72215),
  areaRecord("nanshan-05", "招商板块", 79402),
  areaRecord("nanshan-06", "粤海板块", 63677),
  areaRecord("futian-05", "香蜜湖板块", 64259),
  areaRecord("futian-09", "华强北板块", 52338),
  areaRecord("longhua-03", "民治板块", 52308),
  areaRecord("longgang-02", "布吉板块", 28541),
  areaRecord("longgang-07", "坂田板块", 44663),
  areaRecord("longgang-05", "龙岗板块", 23830),
  areaRecord("longgang-06", "龙城板块", 30172),
];

export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || !Number.isFinite(price) || price <= 0) {
    return "暂无可靠成交数据";
  }
  return `约 ${price.toFixed(2).replace(/0$/, "").replace(/\.$/, "")} 万/㎡`;
}

/** 取某目标最近一次有效成交均价（同物业类型、同价格口径，历史数据置后）。 */
export function latestPriceForTarget(targetId: string): TransactionPrice | null {
  const records = TRANSACTION_PRICES
    .filter((record) => record.targetId === targetId && record.propertyType === "普通商品住宅" && record.priceType === "实际成交均价")
    .sort((a, b) => (a.isHistorical === b.isHistorical ? b.periodEnd.localeCompare(a.periodEnd) : a.isHistorical ? 1 : -1));
  return records[0] ?? null;
}

/** 全市最近月度成交均价及历史序列，用于速览与趋势。 */
export function cityPriceSeries(): TransactionPrice[] {
  return TRANSACTION_PRICES
    .filter((record) => record.targetId === "shenzhen")
    .sort((a, b) => a.periodEnd.localeCompare(b.periodEnd));
}

/** 各区最新成交均价（普睿口径），按价格排序，用于速览列表。 */
export function districtPriceOverview(): Array<{ targetId: string; targetName: string; price: number; sourceName: string }> {
  return TRANSACTION_PRICES
    .filter((record) => !record.isHistorical && record.targetId !== "shenzhen" && record.periodEnd === "2026-10-31" && !record.targetName.includes("板块"))
    .sort((a, b) => b.price - a.price)
    .map((record) => ({ targetId: record.targetId, targetName: record.targetName, price: record.price, sourceName: record.source.name }));
}

export const PRICE_SNAPSHOT_DATE = "2026-11-18";

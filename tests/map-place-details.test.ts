import { describe, expect, it } from "vitest";
import { latestEstateSale } from "@/data/estate-sales";
import { knownPlaceProfile } from "@/data/place-notes";
import { classifyPlace } from "@/lib/map/places";

describe("map landmarks", () => {
  it("keeps named landmarks and villages while excluding numbered blocks and shops", () => {
    expect(classifyPlace({ name: "经济大厦C座", type: "商务住宅;楼宇;商务写字楼", typecode: "120201" })).toBe("办公楼");
    expect(classifyPlace({ name: "合正汇一城2栋B座", type: "商务住宅;楼宇;商务写字楼", typecode: "120201" })).toBeNull();
    expect(classifyPlace({ name: "瑞幸咖啡(大仟里店)", type: "餐饮服务;咖啡厅", typecode: "050500" })).toBeNull();
    expect(classifyPlace({ name: "宝安大仟里", type: "购物服务;商场;普通商场", typecode: "060102|060101" })).toBe("购物中心");
    expect(classifyPlace({ name: "共乐高树围新村", type: "商务住宅;住宅区;住宅小区", typecode: "120302" })).toBe("城中村");
  });
});

describe("place-level price references", () => {
  it("uses the exact Bao'an community and price per square metre from one sale", () => {
    const sale = latestEstateSale("圣淘沙骏园", "宝安区");
    expect(sale?.perSquareMetre).toBeCloseTo(6.39, 2);
    expect(sale?.date).toBe("2026-05-24");
    expect(latestEstateSale("圣淘沙骏园", "南山区")).toBeUndefined();
    expect(latestEstateSale("碧海富通城", "宝安区")).toBeUndefined();
    expect(latestEstateSale("碧海富通城（五期）", "宝安区")?.total).toBe(457);
  });

  it("keeps village references separate from estate transactions", () => {
    expect(knownPlaceProfile("麻布新村", "宝安区", "城中村")?.villagePrice?.sqm).toBe(14_847);
    expect(latestEstateSale("麻布新村", "宝安区")).toBeUndefined();
  });
});

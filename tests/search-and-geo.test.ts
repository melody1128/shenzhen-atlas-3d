import { describe, expect, it } from "vitest";
import { formatDistance, straightLineDistance } from "@/lib/geo/distance";
import { searchLocalEntries } from "@/lib/search/search";
import { formatPrice } from "@/data/prices";

 describe("搜索与地理工具", () => {
  it("搜索翻身返回真实片区线索", () => {
    const results = searchLocalEntries("翻身");
    expect(results.some((entry) => entry.title === "翻身")).toBe(true);
  });

  it("搜索西乡能区分西乡街道与相关地点", () => {
    const results = searchLocalEntries("西乡");
    expect(results[0]?.title).toBe("西乡街道");
  });

  it("空搜索不返回误导性联想", () => {
    expect(searchLocalEntries("   ")).toEqual([]);
  });

  it("直线距离计算与格式正确", () => {
    const distance = straightLineDistance({ lng: 114.0579, lat: 22.5431 }, { lng: 114.0579, lat: 22.5431 });
    expect(distance).toBe(0);
    expect(formatDistance(850)).toBe("850 米");
    expect(formatDistance(1250)).toBe("1.3 公里");
  });

  it("没有真实成交价时明确显示缺失", () => {
    expect(formatPrice(null)).toBe("暂无可靠成交数据");
    expect(formatPrice(undefined)).toBe("暂无可靠成交数据");
    expect(formatPrice(5.8)).toBe("约 5.8 万/㎡");
  });
});

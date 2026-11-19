import { describe, expect, it } from "vitest";
import { ALL_STREETS, DISTRICTS } from "@/data/districts";

 describe("深圳官方行政区划目录", () => {
  it("包含9个行政区、1个功能区与74个街道", () => {
    expect(DISTRICTS).toHaveLength(10);
    expect(DISTRICTS.filter((district) => district.kind === "行政区")).toHaveLength(9);
    expect(DISTRICTS.filter((district) => district.kind === "功能区").map((district) => district.name)).toEqual(["大鹏新区"]);
    expect(ALL_STREETS).toHaveLength(74);
  });

  it("街道ID唯一且都明确标记边界缺失", () => {
    expect(new Set(ALL_STREETS.map((street) => street.id)).size).toBe(74);
    expect(ALL_STREETS.every((street) => street.boundaryStatus === "精确边界数据暂缺")).toBe(true);
  });

  it("优先区域的街道归属正确", () => {
    const baoan = DISTRICTS.find((district) => district.id === "baoan");
    expect(baoan?.streets.map((street) => street.name)).toEqual(expect.arrayContaining(["新安街道", "西乡街道"]));
  });
});

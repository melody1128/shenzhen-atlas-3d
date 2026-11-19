import { describe, expect, it } from "vitest";
import { COMMUNITIES_BY_STREET, communitiesOfStreet } from "@/data/communities";
import { ALL_STREETS } from "@/data/districts";

describe("社区目录（统计局公开数据）", () => {
  it("74 个街道全部收录社区名录", () => {
    const covered = ALL_STREETS.filter((street) => (communitiesOfStreet(street.name)?.length ?? 0) > 0);
    expect(covered.length).toBe(74);
  });

  it("社区总数为正值且不包含功能区虚拟单元", () => {
    const total = COMMUNITIES_BY_STREET.reduce((sum, entry) => sum + entry.communities.length, 0);
    expect(total).toBeGreaterThan(700);
    expect(COMMUNITIES_BY_STREET.some((entry) => entry.streetName.includes("保税区") || entry.streetName.includes("合作区"))).toBe(false);
  });

  it("示例核对：西乡街道与固戍相关社区", () => {
    const xixiang = communitiesOfStreet("西乡街道");
    expect(xixiang?.length).toBeGreaterThan(10);
  });
});

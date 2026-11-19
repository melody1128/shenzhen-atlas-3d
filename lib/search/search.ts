import { CURATED_PLACES } from "@/data/places";
import { DISTRICTS } from "@/data/districts";
import type { CuratedPlace, District, Street } from "@/types/atlas";

export type SearchEntry =
  | { kind: "district"; id: string; title: string; subtitle: string; keywords: string[]; data: District }
  | { kind: "street"; id: string; title: string; subtitle: string; keywords: string[]; data: Street }
  | { kind: "curated"; id: string; title: string; subtitle: string; keywords: string[]; data: CuratedPlace };

export const SEARCH_ENTRIES: SearchEntry[] = [
  ...DISTRICTS.map((district): SearchEntry => ({
    kind: "district",
    id: district.id,
    title: district.name,
    subtitle: `${district.kind} · ${district.streets.length} 个街道`,
    keywords: [district.name, district.name.replace(/区|新区/g, ""), district.id],
    data: district,
  })),
  ...DISTRICTS.flatMap((district): SearchEntry[] => district.streets.map((street) => ({
    kind: "street",
    id: street.id,
    title: street.name,
    subtitle: `${district.name} · 街道`,
    keywords: [street.name, street.name.replace("街道", ""), district.name],
    data: street,
  }))),
  ...CURATED_PLACES.map((place): SearchEntry => {
    const district = DISTRICTS.find((item) => item.id === place.districtId);
    return {
      kind: "curated",
      id: place.id,
      title: place.name,
      subtitle: `${district?.name ?? "深圳"} · ${place.category}`,
      keywords: [place.name, ...place.aliases, place.areaName ?? "", district?.name ?? ""],
      data: place,
    };
  }),
];

/** 本地目录搜索不伪造联想内容；远程 POI 检索由地图服务另行完成。 */
export function searchLocalEntries(query: string, limit = 12): SearchEntry[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return [];
  return SEARCH_ENTRIES
    .map((entry) => {
      const title = entry.title.toLocaleLowerCase();
      const matched = entry.keywords.some((keyword) => keyword.toLocaleLowerCase().includes(normalized));
      const score = title === normalized ? 0 : title.startsWith(normalized) ? 1 : matched ? 2 : 99;
      return { entry, score };
    })
    .filter(({ score }) => score < 99)
    .sort((a, b) => a.score - b.score || a.entry.title.length - b.entry.title.length)
    .slice(0, limit)
    .map(({ entry }) => entry);
}

import type { AtlasPlace } from "@/types/atlas";

export type AtlasSelection =
  | { kind: "district"; districtId: string }
  | { kind: "street"; streetId: string; resolving: boolean; resolvedPlace?: AtlasPlace; error?: string }
  | { kind: "curated"; curatedId: string; resolving: boolean; place?: AtlasPlace; error?: string }
  | { kind: "community"; streetId: string; communityName: string; resolving: boolean; place?: AtlasPlace; error?: string }
  | { kind: "place"; place: AtlasPlace };

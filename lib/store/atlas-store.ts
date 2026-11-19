"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AtlasPlace, ExplorationRecord } from "@/types/atlas";

export interface ExploreTarget {
  id: string;
  name: string;
  category: string;
  districtName?: string;
  place?: AtlasPlace;
}

interface AtlasState {
  records: Record<string, ExplorationRecord>;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  markViewed: (target: ExploreTarget) => void;
  toggleKnown: (target: ExploreTarget) => void;
  toggleFavorite: (target: ExploreTarget) => void;
  toggleWishlist: (target: ExploreTarget) => void;
}

function currentRecord(records: Record<string, ExplorationRecord>, target: ExploreTarget): ExplorationRecord {
  return records[target.id] ?? {
    name: target.name,
    category: target.category,
    districtName: target.districtName,
    place: target.place,
    status: "已浏览",
    viewedAt: new Date().toISOString(),
    favorite: false,
    wishlist: false,
  };
}

export const useAtlasStore = create<AtlasState>()(
  persist(
    (set) => ({
      records: {},
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      markViewed: (target) => set((state) => ({
        records: {
          ...state.records,
          [target.id]: {
            ...currentRecord(state.records, target),
            ...target,
            viewedAt: new Date().toISOString(),
          },
        },
      })),
      toggleKnown: (target) => set((state) => {
        const previous = currentRecord(state.records, target);
        const known = previous.status !== "已了解";
        return {
          records: {
            ...state.records,
            [target.id]: {
              ...previous,
              ...target,
              status: known ? "已了解" : "已浏览",
              knownAt: known ? new Date().toISOString() : undefined,
            },
          },
        };
      }),
      toggleFavorite: (target) => set((state) => {
        const previous = currentRecord(state.records, target);
        return { records: { ...state.records, [target.id]: { ...previous, ...target, favorite: !previous.favorite } } };
      }),
      toggleWishlist: (target) => set((state) => {
        const previous = currentRecord(state.records, target);
        return { records: { ...state.records, [target.id]: { ...previous, ...target, wishlist: !previous.wishlist } } };
      }),
    }),
    {
      name: "shenzhen-atlas-exploration-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ records: state.records }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);

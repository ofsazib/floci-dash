import { create } from "zustand";

const STORAGE_KEY = "fd-recently-visited";
const MAX_ITEMS = 10;

function loadRecentlyVisited(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveRecentlyVisited(items: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

interface RecentlyVisitedState {
  recentlyVisited: string[];
  addVisited: (serviceKey: string) => void;
  clearVisited: () => void;
}

export const useRecentlyVisited = create<RecentlyVisitedState>((set) => ({
  recentlyVisited: loadRecentlyVisited(),
  addVisited: (serviceKey) =>
    set((s) => {
      const filtered = s.recentlyVisited.filter((k) => k !== serviceKey);
      const next = [serviceKey, ...filtered].slice(0, MAX_ITEMS);
      saveRecentlyVisited(next);
      return { recentlyVisited: next };
    }),
  clearVisited: () => {
    saveRecentlyVisited([]);
    set({ recentlyVisited: [] });
  },
}));

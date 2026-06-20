import { create } from "zustand";

const STORAGE_KEY = "fd-favorites";

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveFavorites(favorites: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {}
}

interface FavoritesState {
  favorites: string[];
  addFavorite: (serviceKey: string) => void;
  removeFavorite: (serviceKey: string) => void;
  toggleFavorite: (serviceKey: string) => void;
  isFavorite: (serviceKey: string) => boolean;
}

export const useFavorites = create<FavoritesState>((set, get) => ({
  favorites: loadFavorites(),
  addFavorite: (serviceKey) =>
    set((s) => {
      if (s.favorites.includes(serviceKey)) return s;
      const next = [...s.favorites, serviceKey];
      saveFavorites(next);
      return { favorites: next };
    }),
  removeFavorite: (serviceKey) =>
    set((s) => {
      const next = s.favorites.filter((k) => k !== serviceKey);
      saveFavorites(next);
      return { favorites: next };
    }),
  toggleFavorite: (serviceKey) => {
    const { favorites } = get();
    if (favorites.includes(serviceKey)) {
      get().removeFavorite(serviceKey);
    } else {
      get().addFavorite(serviceKey);
    }
  },
  isFavorite: (serviceKey) => get().favorites.includes(serviceKey),
}));

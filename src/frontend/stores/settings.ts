import { create } from "zustand";

interface SettingsState {
  darkMode: boolean;
  refreshInterval: number;
  toggleDarkMode: () => void;
  setRefreshInterval: (ms: number) => void;
}

export const useSettings = create<SettingsState>((set) => ({
  darkMode: true,
  refreshInterval: 5000,
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  setRefreshInterval: (ms) => set({ refreshInterval: ms }),
}));

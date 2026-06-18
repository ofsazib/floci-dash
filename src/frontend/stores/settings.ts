import { create } from "zustand";

const STORAGE_KEY = "fd-settings";

function loadSettings(): { darkMode: boolean; refreshInterval: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { darkMode: true, refreshInterval: 5000 };
}

function saveSettings(settings: { darkMode: boolean; refreshInterval: number }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

interface SettingsState {
  darkMode: boolean;
  refreshInterval: number;
  toggleDarkMode: () => void;
  setRefreshInterval: (ms: number) => void;
}

export const useSettings = create<SettingsState>((set) => {
  const initial = loadSettings();
  return {
    darkMode: initial.darkMode,
    refreshInterval: initial.refreshInterval,
    toggleDarkMode: () =>
      set((s) => {
        const nextMode = !s.darkMode;
        saveSettings({ darkMode: nextMode, refreshInterval: s.refreshInterval });
        return { darkMode: nextMode };
      }),
    setRefreshInterval: (ms) =>
      set((s) => {
        saveSettings({ darkMode: s.darkMode, refreshInterval: ms });
        return { refreshInterval: ms };
      }),
  };
});

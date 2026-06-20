import { create } from "zustand";

const STORAGE_KEY = "fd-settings";

interface PersistedSettings {
  darkMode: boolean;
  refreshInterval: number;
  flociEndpoint?: string;
}

function loadSettings(): PersistedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { darkMode: true, refreshInterval: 5000 };
}

function saveSettings(settings: PersistedSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

interface SettingsState extends PersistedSettings {
  toggleDarkMode: () => void;
  setRefreshInterval: (ms: number) => void;
  setFlociEndpoint: (url: string) => void;
}

export const useSettings = create<SettingsState>((set) => {
  const initial = loadSettings();
  return {
    darkMode: initial.darkMode,
    refreshInterval: initial.refreshInterval,
    flociEndpoint: initial.flociEndpoint,
    toggleDarkMode: () =>
      set((s) => {
        const nextMode = !s.darkMode;
        saveSettings({ darkMode: nextMode, refreshInterval: s.refreshInterval, flociEndpoint: s.flociEndpoint });
        return { darkMode: nextMode };
      }),
    setRefreshInterval: (ms) =>
      set((s) => {
        saveSettings({ darkMode: s.darkMode, refreshInterval: ms, flociEndpoint: s.flociEndpoint });
        return { refreshInterval: ms };
      }),
    setFlociEndpoint: (url) =>
      set((s) => {
        saveSettings({ darkMode: s.darkMode, refreshInterval: s.refreshInterval, flociEndpoint: url });
        return { flociEndpoint: url };
      }),
  };
});

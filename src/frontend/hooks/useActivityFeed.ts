import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "floci-activity-feed";
const MAX_ENTRIES = 50;

export interface ActivityEntry {
  id: string;
  timestamp: number;
  action: "create" | "delete" | "navigate";
  service: string;
  resource?: string;
  description: string;
}

function getEntries(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActivityEntry[]) : [];
  } catch {
    return [];
  }
}

let listeners: Set<() => void> = new Set();
let cached = getEntries();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return cached;
}

function emitChange() {
  cached = getEntries();
  listeners.forEach((cb) => cb());
}

export function addActivity(entry: Omit<ActivityEntry, "id" | "timestamp">) {
  const entries = getEntries();
  entries.unshift({ id: crypto.randomUUID(), timestamp: Date.now(), ...entry });
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  emitChange();
}

export function clearActivity() {
  localStorage.removeItem(STORAGE_KEY);
  emitChange();
}

export function useActivityFeed() {
  const entries = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const add = useCallback((entry: Omit<ActivityEntry, "id" | "timestamp">) => {
    addActivity(entry);
  }, []);

  const clear = useCallback(() => {
    clearActivity();
  }, []);

  return { entries, addActivity: add, clearActivity: clear };
}

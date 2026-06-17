import { describe, it, expect, beforeEach } from "vitest";
import { useSettings } from "./settings";

// Zustand store — exercised directly via getState/setState, no React needed.
describe("settings store", () => {
  beforeEach(() => {
    // Reset to defaults between tests.
    useSettings.setState({ darkMode: true, refreshInterval: 5000 });
  });

  it("starts with sensible defaults", () => {
    const s = useSettings.getState();
    expect(s.darkMode).toBe(true);
    expect(s.refreshInterval).toBe(5000);
  });

  it("toggleDarkMode flips darkMode", () => {
    useSettings.getState().toggleDarkMode();
    expect(useSettings.getState().darkMode).toBe(false);
    useSettings.getState().toggleDarkMode();
    expect(useSettings.getState().darkMode).toBe(true);
  });

  it("setRefreshInterval updates the interval", () => {
    useSettings.getState().setRefreshInterval(10000);
    expect(useSettings.getState().refreshInterval).toBe(10000);
  });
});

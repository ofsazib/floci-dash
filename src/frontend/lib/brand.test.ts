import { describe, it, expect } from "vitest";
import { getBrand, FLOCI_LOGO_SVG } from "./brand";

describe("getBrand", () => {
  it("defaults to Floci", () => {
    expect(getBrand({})).toEqual({ name: "Floci", title: "Floci Dash", logo: FLOCI_LOGO_SVG });
    expect(getBrand({ VITE_BRAND_NAME: " ", VITE_BRAND_LOGO: " " })).toEqual({ name: "Floci", title: "Floci Dash", logo: FLOCI_LOGO_SVG });
  });

  it("uses a custom name as the title when there is no custom logo", () => {
    expect(getBrand({ VITE_BRAND_NAME: " Acme " })).toEqual({ name: "Acme", title: "Acme", logo: FLOCI_LOGO_SVG });
  });

  it("shows a custom logo on its own", () => {
    expect(getBrand({ VITE_BRAND_NAME: "Acme", VITE_BRAND_LOGO: "/brand/logo.svg" })).toEqual({ name: "Acme", title: undefined, logo: "/brand/logo.svg" });
    expect(getBrand({ VITE_BRAND_LOGO: "/brand/logo.svg" }).name).toBe("Floci");
  });

  it("reads Vite's env by default", () => {
    expect(getBrand().name).toBeTruthy();
  });
});

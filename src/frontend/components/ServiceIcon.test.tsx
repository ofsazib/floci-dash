// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ServiceIcon, { CATEGORY_COLORS } from "./ServiceIcon";

function tile(key: string, size?: number) {
  const { container } = render(<ServiceIcon serviceKey={key} size={size} />);
  return container.querySelector<HTMLElement>(".fd-service-icon")!;
}

describe("ServiceIcon", () => {
  it("shows the label initial in the category colour", () => {
    const el = tile("ec2");
    expect(el.textContent).toBe("E");
    expect(el.style.backgroundColor).toBe(CATEGORY_COLORS.Compute);
    expect(el.style.width).toBe("16px");
  });

  it("falls back to grey and the raw key for unknown services", () => {
    const el = tile("zeta", 20);
    expect(el.textContent).toBe("Z");
    expect(el.style.backgroundColor).toBe("#545b64");
    expect(el.style.width).toBe("20px");
  });
});

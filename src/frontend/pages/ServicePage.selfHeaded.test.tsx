// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const { mockParams } = vi.hoisted(() => ({ mockParams: vi.fn() }));

vi.mock("react-router-dom", () => ({ useParams: () => mockParams() }));
vi.mock("../hooks/useSystem", () => ({ useHealth: () => ({ data: { services: {} } }) }));
vi.mock("./serviceRegistry", () => ({
  SERVICE_DASHBOARDS: {
    own: () => <div>own dashboard</div>,
    plain: () => <div>plain dashboard</div>,
  },
  SELF_HEADED_DASHBOARDS: new Set(["own"]),
}));

import ServicePage from "./ServicePage";

describe("ServicePage — self-headed dashboards", () => {
  it("renders a self-headed dashboard without the generic page header", () => {
    mockParams.mockReturnValue({ service: "own" });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getByText("own dashboard")).toBeTruthy();
    expect(screen.queryByText("Manage resources")).toBeNull();
  });

  it("wraps other dashboards in the generic page header", () => {
    mockParams.mockReturnValue({ service: "plain" });
    render(<ServicePage />, { wrapper: createWrapper() });
    expect(screen.getByText("plain dashboard")).toBeTruthy();
    expect(screen.getByText("Manage resources")).toBeTruthy();
  });
});

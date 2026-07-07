// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const mockIsFavorite = vi.fn();
const mockToggleFavorite = vi.fn();
vi.mock("../stores/favorites", () => ({
  useFavorites: () => ({
    isFavorite: mockIsFavorite,
    toggleFavorite: mockToggleFavorite,
  }),
}));

// Mock ServiceCard so we can verify props passed to it
vi.mock("./ServiceCard", () => ({
  default: ({ serviceKey, status }: { serviceKey: string; status: string }) =>
    React.createElement("div", { "data-testid": `card-${serviceKey}`, "data-status": status }, serviceKey),
}));

import ServiceGrid from "./ServiceGrid";

beforeEach(() => {
  vi.clearAllMocks();
  mockIsFavorite.mockReturnValue(false);
});

describe("ServiceGrid", () => {
  it("renders services grouped by category", () => {
    render(
      <ServiceGrid
        services={{
          ec2: "running",
          lambda: "available",
          s3: "running",
          dynamodb: "running",
        }}
      />,
    );

    // Category headers
    expect(screen.getByText("Compute")).toBeTruthy();
    expect(screen.getByText("Storage")).toBeTruthy();
    expect(screen.getByText("Database")).toBeTruthy();

    // Service cards
    expect(screen.getByTestId("card-ec2")).toBeTruthy();
    expect(screen.getByTestId("card-lambda")).toBeTruthy();
    expect(screen.getByTestId("card-s3")).toBeTruthy();
    expect(screen.getByTestId("card-dynamodb")).toBeTruthy();
  });

  it("sorts services alphabetically within each category", () => {
    render(
      <ServiceGrid
        services={{
          lambda: "running",
          ec2: "running",
        }}
      />,
    );

    const computeCards = screen.getAllByTestId(/^card-/);
    // EC2 should come before Lambda alphabetically
    expect(computeCards[0].textContent).toBe("ec2");
    expect(computeCards[1].textContent).toBe("lambda");
  });

  it("assigns unknown services to 'Other' category", () => {
    render(
      <ServiceGrid
        services={{
          unknown_service: "running",
        }}
      />,
    );

    expect(screen.getByText("Other")).toBeTruthy();
    expect(screen.getByTestId("card-unknown_service")).toBeTruthy();
  });

  it("does not render categories with no services", () => {
    const { queryByText } = render(
      <ServiceGrid
        services={{
          s3: "running",
        }}
      />,
    );

    // Only Storage category should be present
    expect(screen.getByText("Storage")).toBeTruthy();
    expect(queryByText("Compute")).toBeFalsy();
    expect(queryByText("Database")).toBeFalsy();
  });

  it("passes correct status to service cards", () => {
    render(
      <ServiceGrid
        services={{
          ec2: "running",
          lambda: "available",
        }}
      />,
    );

    expect(screen.getByTestId("card-ec2").getAttribute("data-status")).toBe("running");
    expect(screen.getByTestId("card-lambda").getAttribute("data-status")).toBe("available");
  });

  it("renders multiple services in the same category", () => {
    render(
      <ServiceGrid
        services={{
          ec2: "running",
          lambda: "available",
          autoscaling: "running",
        }}
      />,
    );

    expect(screen.getByTestId("card-ec2")).toBeTruthy();
    expect(screen.getByTestId("card-lambda")).toBeTruthy();
    expect(screen.getByTestId("card-autoscaling")).toBeTruthy();
    expect(screen.getByText("Compute")).toBeTruthy();
  });
});

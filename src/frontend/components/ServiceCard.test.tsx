// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the favorites store
const mockIsFavorite = vi.fn();
const mockToggleFavorite = vi.fn();
vi.mock("../stores/favorites", () => ({
  useFavorites: () => ({
    isFavorite: mockIsFavorite,
    toggleFavorite: mockToggleFavorite,
  }),
}));

import ServiceCard from "./ServiceCard";

beforeEach(() => {
  vi.clearAllMocks();
  mockIsFavorite.mockReturnValue(false);
});

describe("ServiceCard", () => {
  it("renders service label", () => {
    render(<ServiceCard serviceKey="s3" status="running" />);
    expect(screen.getByText("S3")).toBeTruthy();
  });

  it("navigates to service on click", async () => {
    const user = userEvent.setup();
    render(<ServiceCard serviceKey="s3" status="running" />);
    await user.click(screen.getByRole("button", { name: /open s3/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/services/s3");
  });

  it("navigates to service on Enter key", async () => {
    const user = userEvent.setup();
    render(<ServiceCard serviceKey="ec2" status="available" />);
    const card = screen.getByRole("button", { name: /open ec2/i });
    card.focus();
    await user.keyboard("{Enter}");
    expect(mockNavigate).toHaveBeenCalledWith("/services/ec2");
  });

  it("navigates to service on Space key", async () => {
    const user = userEvent.setup();
    render(<ServiceCard serviceKey="lambda" status="running" />);
    const card = screen.getByRole("button", { name: /open lambda/i });
    card.focus();
    await user.keyboard(" ");
    expect(mockNavigate).toHaveBeenCalledWith("/services/lambda");
  });

  it("toggles favorite when star is clicked", async () => {
    const user = userEvent.setup();
    render(<ServiceCard serviceKey="s3" status="running" />);
    const starBtn = screen.getByRole("button", { name: /add s3 to favorites/i });
    await user.click(starBtn);
    expect(mockToggleFavorite).toHaveBeenCalledWith("s3");
  });

  it("shows filled star when favorite", () => {
    mockIsFavorite.mockReturnValue(true);
    render(<ServiceCard serviceKey="s3" status="running" />);
    const starBtn = screen.getByRole("button", { name: /remove s3 from favorites/i });
    expect(starBtn).toBeTruthy();
  });

  it("renders running status indicator", () => {
    const { container } = render(<ServiceCard serviceKey="ec2" status="running" />);
    expect(container.querySelector(".fd-accent-success")).toBeTruthy();
  });

  it("renders available status indicator", () => {
    const { container } = render(<ServiceCard serviceKey="ec2" status="available" />);
    expect(container.querySelector(".fd-accent-warning")).toBeTruthy();
  });

  it("prevents navigation when star is clicked", async () => {
    const user = userEvent.setup();
    render(<ServiceCard serviceKey="s3" status="running" />);
    const starBtn = screen.getByRole("button", { name: /add s3 to favorites/i });
    await user.click(starBtn);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

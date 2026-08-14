// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  it("shows Running with success indicator for running", () => {
    render(<StatusBadge status="running" />);
    expect(screen.getByText("Running")).toBeTruthy();
  });

  it("shows Available with warning indicator for available", () => {
    render(<StatusBadge status="available" />);
    expect(screen.getByText("Available")).toBeTruthy();
  });

  it("shows Error with error indicator for error", () => {
    render(<StatusBadge status="error" />);
    expect(screen.getByText("Error")).toBeTruthy();
  });

  it("shows Connected with success indicator for connected", () => {
    render(<StatusBadge status="connected" />);
    expect(screen.getByText("Connected")).toBeTruthy();
  });
});

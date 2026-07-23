// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createWrapper } from "../../../test/helpers";
import React from "react";

vi.mock("../../hooks/useTextract", () => ({}));

import { TextractDashboard } from "./TextractDashboard";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TextractDashboard", () => {
  it("renders info alert with service description", () => {
    render(<TextractDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/document analysis service/i)).toBeTruthy();
    expect(screen.getByText(/DetectDocumentText/i)).toBeTruthy();
  });

  it("renders with proper type info", () => {
    const { container } = render(<TextractDashboard />, { wrapper: createWrapper() });
    expect(container.querySelector('[class*="alert"]')).toBeTruthy();
  });

  it("renders AnalyzeDocument API reference", () => {
    render(<TextractDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/AnalyzeDocument/i)).toBeTruthy();
    expect(screen.getByText(/extract text and data from documents/i)).toBeTruthy();
  });

  it("renders sync and async operation reference", () => {
    render(<TextractDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/sync and async operations/i)).toBeTruthy();
  });
});

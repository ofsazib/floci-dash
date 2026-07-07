// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createWrapper } from "../../../test/helpers";
import React from "react";

import { BedrockRuntimeDashboard } from "./BedrockRuntimeDashboard";

describe("BedrockRuntimeDashboard", () => {
  it("renders info alert about Bedrock being a data-plane service", () => {
    render(<BedrockRuntimeDashboard />, { wrapper: createWrapper() });
    expect(
      screen.getByText(/Bedrock Runtime is a data-plane service/),
    ).toBeTruthy();
    expect(
      screen.getByText(/Converse API or InvokeModel API/),
    ).toBeTruthy();
    expect(
      screen.getByText(/models are invoked directly/),
    ).toBeTruthy();
  });
});

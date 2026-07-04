// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import ServiceDashboardLayout from "./ServiceDashboardLayout";

describe("ServiceDashboardLayout", () => {
  it("renders tabs when provided", () => {
    render(
      <ServiceDashboardLayout
        tabs={[
          { id: "tab1", label: "Tab One", content: <div>Content 1</div> },
          { id: "tab2", label: "Tab Two", content: <div>Content 2</div> },
        ]}
      />,
    );

    expect(screen.getByText("Tab One")).toBeTruthy();
    expect(screen.getByText("Tab Two")).toBeTruthy();
    expect(screen.getByText("Content 1")).toBeTruthy();
  });

  it("shows loading state", () => {
    const { container } = render(
      <ServiceDashboardLayout
        tabs={[
          { id: "tab1", label: "Tab One", content: <div>Content</div> },
        ]}
        loading={true}
      />,
    );

    expect(screen.getByText("Loading...")).toBeTruthy();
    expect(container.querySelector('[tabindex="0"]')).toBeNull(); // No tabs rendered
  });

  it("shows error state", () => {
    const { container } = render(
      <ServiceDashboardLayout
        tabs={[
          { id: "tab1", label: "Tab One", content: <div>Content</div> },
        ]}
        error="Failed to load data"
      />,
    );

    expect(screen.getByText("Failed to load data")).toBeTruthy();
  });

  it("shows empty state", () => {
    render(
      <ServiceDashboardLayout
        tabs={[
          { id: "tab1", label: "Tab One", content: <div>Content</div> },
        ]}
        empty={{ title: "No resources", description: "Create one to get started" }}
      />,
    );

    expect(screen.getByText("No resources")).toBeTruthy();
    expect(screen.getByText("Create one to get started")).toBeTruthy();
  });

  it("shows empty state with action button", () => {
    const onAction = vi.fn();
    render(
      <ServiceDashboardLayout
        tabs={[
          { id: "tab1", label: "Tab One", content: <div>Content</div> },
        ]}
        empty={{
          title: "No items",
          actionText: "Create Item",
          onAction,
        }}
      />,
    );

    expect(screen.getByText("Create Item")).toBeTruthy();
  });

  it("renders back button above tabs", () => {
    render(
      <ServiceDashboardLayout
        tabs={[
          { id: "tab1", label: "Tab One", content: <div>Content</div> },
        ]}
        backButton={<button>Back</button>}
      />,
    );

    expect(screen.getByText("Back")).toBeTruthy();
    expect(screen.getByText("Tab One")).toBeTruthy();
  });

  it("returns null for empty tabs array with no loading/error", () => {
    const { container } = render(<ServiceDashboardLayout tabs={[]} />);

    expect(container.innerHTML).toBe("");
  });

  it("shows loading before error when both are set", () => {
    render(
      <ServiceDashboardLayout
        tabs={[
          { id: "tab1", label: "Tab One", content: <div>Content</div> },
        ]}
        loading={true}
        error="Error message"
      />,
    );

    // Loading takes priority
    expect(screen.getByText("Loading...")).toBeTruthy();
    expect(screen.queryByText("Error message")).toBeNull();
  });
});

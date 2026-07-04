// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import PropertyTable from "./PropertyTable";
import { StatusIndicator } from "@cloudscape-design/components";

const sampleItems = [
  { label: "Instance ID", value: "i-12345" },
  { label: "State", value: "running" },
  { label: "VPC ID", value: "vpc-abc" },
];

describe("PropertyTable", () => {
  it("renders all items in horizontal variant by default", () => {
    render(<PropertyTable items={sampleItems} />);

    expect(screen.getByText("Instance ID")).toBeTruthy();
    expect(screen.getByText("i-12345")).toBeTruthy();
    expect(screen.getByText("State")).toBeTruthy();
    expect(screen.getByText("running")).toBeTruthy();
    expect(screen.getByText("VPC ID")).toBeTruthy();
    expect(screen.getByText("vpc-abc")).toBeTruthy();
  });

  it("renders React nodes as values", () => {
    const items = [
      { label: "Status", value: <StatusIndicator type="success">Available</StatusIndicator> },
    ];
    render(<PropertyTable items={items} />);

    expect(screen.getByText("Available")).toBeTruthy();
  });

  it("renders grid variant", () => {
    const { container } = render(
      <PropertyTable items={sampleItems} variant="grid" />,
    );

    // Grid layout uses a div-based grid structure
    expect(screen.getByText("Instance ID")).toBeTruthy();
    expect(screen.getByText("i-12345")).toBeTruthy();
    // Should have grid styling
    expect(container.querySelector('[style*="grid"]')).toBeTruthy();
  });

  it("returns null for empty items", () => {
    const { container } = render(<PropertyTable items={[]} />);

    expect(container.innerHTML).toBe("");
  });

  it("renders single item", () => {
    render(<PropertyTable items={[{ label: "Name", value: "test" }]} />);

    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("test")).toBeTruthy();
  });

  it("renders item with long value without breaking layout", () => {
    const longValue = "arn:aws:rds:us-east-1:123456789012:db:my-long-instance-name-that-should-not-break";
    render(<PropertyTable items={[{ label: "ARN", value: longValue }]} />);

    expect(screen.getByText("ARN")).toBeTruthy();
    expect(screen.getByText(longValue)).toBeTruthy();
  });

  it("applies custom labelWidth", () => {
    const { container } = render(
      <PropertyTable items={sampleItems} labelWidth="300px" />,
    );

    const cells = container.querySelectorAll("td");
    // First td in each row should have the custom width
    const firstCell = cells[0];
    expect(firstCell?.getAttribute("style")).toContain("300px");
  });

  it("renders value as link when href is set", () => {
    const items = [
      { label: "Resource", value: "my-bucket", href: "/services/s3" },
    ];
    render(<PropertyTable items={items} />);

    const link = screen.getByText("my-bucket");
    expect(link).toBeTruthy();
    expect(link.closest("a")).toBeTruthy();
  });

  it("renders grid variant with href links", () => {
    const items = [
      { label: "Resource", value: "my-bucket", href: "/services/s3" },
    ];
    render(<PropertyTable items={items} variant="grid" />);

    const link = screen.getByText("my-bucket");
    expect(link).toBeTruthy();
    expect(link.closest("a")).toBeTruthy();
  });
});

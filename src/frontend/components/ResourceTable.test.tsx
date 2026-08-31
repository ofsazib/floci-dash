// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import ResourceTable from "./ResourceTable";

const columns = [
  { id: "name", header: "Name", cell: (i: any) => i.name, isRowHeader: true },
  { id: "size", header: "Size", cell: (i: any) => i.size ?? "-" },
];

const items = [
  { name: "alpha", size: 10 },
  { name: "beta", size: 20 },
];

describe("ResourceTable", () => {
  it("renders a header title with counter and action buttons", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const onRefresh = vi.fn();
    render(
      <ResourceTable
        resourceName="Bucket"
        items={items}
        columns={columns}
        headerTitle="Buckets"
        headerCounter={2}
        headerActions={<button>Custom action</button>}
        onCreate={onCreate}
        onRefresh={onRefresh}
      />,
    );
    expect(screen.getByText("Buckets")).toBeTruthy();
    expect(screen.getByText("(2)")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Custom action" }));
    await user.click(screen.getByRole("button", { name: /Create Bucket/i }));
    expect(onCreate).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: /Refresh/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("renders a bare button bar without a header title", () => {
    render(
      <ResourceTable
        resourceName="Bucket"
        items={items}
        columns={columns}
        onCreate={() => {}}
        onRefresh={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /Create Bucket/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Refresh/i })).toBeTruthy();
  });

  it("omits the Refresh button from the bare bar when onRefresh is missing", () => {
    render(
      <ResourceTable
        resourceName="Bucket"
        items={items}
        columns={columns}
        onCreate={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /Create Bucket/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Refresh/i })).toBeNull();
  });

  it("falls back to items.length for the header counter", () => {
    render(
      <ResourceTable resourceName="Bucket" items={items} columns={columns} headerTitle="Buckets" />,
    );
    expect(screen.getByText("Buckets")).toBeTruthy();
    expect(screen.getByText("(2)")).toBeTruthy();
  });

  it("applies an explicit column width", () => {
    const cols = [
      { id: "name", header: "Name", cell: (i: any) => i.name, width: 200 },
      { id: "size", header: "Size", cell: (i: any) => i.size },
    ];
    render(<ResourceTable resourceName="Bucket" items={items} columns={cols} />);
    const headers = Array.from(document.querySelectorAll("th"));
    const nameTh = headers.find((h) => h.textContent?.includes("Name"));
    expect(nameTh?.getAttribute("style") ?? "").toContain("200");
  });

  it("gives an actions column a fixed width only when onDelete is provided", () => {
    const withDelete = [
      { id: "name", header: "Name", cell: (i: any) => i.name },
      { id: "actions", header: "Actions", cell: (i: any) => <span>x</span> },
    ];
    const { unmount } = render(
      <ResourceTable resourceName="Bucket" items={items} columns={withDelete} onDelete={vi.fn()} />,
    );
    let headers = Array.from(document.querySelectorAll("th"));
    const actionsTh = headers.find((h) => h.textContent?.includes("Actions"));
    expect(actionsTh?.getAttribute("style") ?? "").toContain("80");
    unmount();

    // Same actions column without onDelete → no forced width
    render(<ResourceTable resourceName="Bucket" items={items} columns={withDelete} />);
    headers = Array.from(document.querySelectorAll("th"));
    const actionsTh2 = headers.find((h) => h.textContent?.includes("Actions"));
    expect(actionsTh2?.getAttribute("style") ?? "").not.toContain("80");
  });

  it("filters items with the default filter and shows singular and plural counts", async () => {
    const user = userEvent.setup();
    render(
      <ResourceTable
        resourceName="Bucket"
        items={items}
        columns={columns}
        filterEnabled
        filterPlaceholder="Find buckets"
      />,
    );
    const input = screen.getByPlaceholderText("Find buckets") as HTMLInputElement;
    await user.type(input, "alp");
    expect(screen.getAllByText("1 match").length).toBeGreaterThan(0);
    expect(screen.queryByText("beta")).toBeNull();
    await user.clear(input);
    await user.type(input, "a");
    expect(screen.getAllByText("2 matches").length).toBeGreaterThan(0);
  });

  it("uses a custom filterFunction and the default placeholder", async () => {
    const user = userEvent.setup();
    const filterFunction = vi.fn((item: any, search: string) =>
      item.name.includes(search),
    );
    render(
      <ResourceTable
        resourceName="Bucket"
        items={items}
        columns={columns}
        filterEnabled
        filterFunction={filterFunction}
      />,
    );
    const input = screen.getByPlaceholderText("Find buckets") as HTMLInputElement;
    await user.type(input, "beta");
    expect(filterFunction).toHaveBeenCalled();
    expect(screen.getAllByText("1 match").length).toBeGreaterThan(0);
  });

  it("shows the no-matches empty state when a search yields nothing", async () => {
    const user = userEvent.setup();
    render(
      <ResourceTable
        resourceName="Bucket"
        items={items}
        columns={columns}
        filterEnabled
      />,
    );
    const input = screen.getByPlaceholderText("Find buckets") as HTMLInputElement;
    await user.type(input, "zzz");
    expect(screen.getByText("No matches")).toBeTruthy();
    expect(
      screen.getByText(/No buckets match "zzz"\. Try a different search term\./),
    ).toBeTruthy();
  });

  it("shows the default empty message without a filter", () => {
    render(<ResourceTable resourceName="Bucket" items={[]} columns={columns} />);
    expect(screen.getByText("No buckets found")).toBeTruthy();
  });

  it("shows a custom empty message with the create hint", () => {
    render(
      <ResourceTable
        resourceName="Bucket"
        items={[]}
        columns={columns}
        emptyMessage="Nothing here yet"
        onCreate={() => {}}
      />,
    );
    expect(screen.getByText("Nothing here yet")).toBeTruthy();
    expect(
      screen.getByText('Click "Create Bucket" to get started.'),
    ).toBeTruthy();
  });

  it("shows the loading text while loading", () => {
    render(
      <ResourceTable resourceName="Bucket" items={[]} columns={columns} loading />,
    );
    expect(screen.getByText("Loading resources...")).toBeTruthy();
  });

  it("renders a pagination slot when provided", () => {
    render(
      <ResourceTable
        resourceName="Bucket"
        items={items}
        columns={columns}
        pagination={<nav aria-label="table pages">Page 1</nav>}
      />,
    );
    expect(screen.getByLabelText("table pages")).toBeTruthy();
    expect(screen.getByText("Page 1")).toBeTruthy();
  });

  it("renders rows without a filter and falls back to dashes in cells", () => {
    const cols = [
      { id: "name", header: "Name", cell: (i: any) => i.name },
      { id: "size", header: "Size", cell: (i: any) => i.size ?? "-" },
    ];
    render(
      <ResourceTable
        resourceName="Bucket"
        items={[{ name: "alpha" }]}
        columns={cols}
      />,
    );
    expect(screen.getByText("alpha")).toBeTruthy();
    expect(screen.getByText("-")).toBeTruthy();
  });
});

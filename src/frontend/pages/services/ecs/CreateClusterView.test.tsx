// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const m = vi.hoisted(() => ({ create: vi.fn(), toast: vi.fn() }));

vi.mock("../../../hooks/useECS", () => ({ useCreateECSCluster: () => ({ mutate: m.create, isPending: false }) }));
vi.mock("../../../components/Toast", () => ({ useToast: () => ({ showToast: m.toast }) }));

import CreateClusterView from "./CreateClusterView";

beforeEach(() => vi.clearAllMocks());

const name = (v: string) => fireEvent.change(screen.getByLabelText("Cluster name"), { target: { value: v } });
const create = () => fireEvent.click(screen.getByRole("button", { name: "Create" }));

describe("CreateClusterView", () => {
  it("shows the console sections with Fargate selected", () => {
    render(<CreateClusterView onDone={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Create cluster" })).toBeTruthy();
    expect(screen.getByText("Infrastructure - advanced")).toBeTruthy();
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios.map((r) => r.checked)).toEqual([true, false, false]);
    expect(radios.map((r) => r.disabled)).toEqual([false, true, true]);
    expect(screen.getByText("Monitoring - optional")).toBeTruthy();
  });

  it("validates the cluster name only after submitting", () => {
    render(<CreateClusterView onDone={vi.fn()} />);
    expect(screen.queryByText(/Enter a valid cluster name/)).toBeNull();
    create();
    expect(screen.getByText(/Enter a valid cluster name/)).toBeTruthy();
    name("bad name!");
    expect(screen.getByText(/Enter a valid cluster name/)).toBeTruthy();
    expect(m.create).not.toHaveBeenCalled();
  });

  it("creates a cluster with tags and returns", () => {
    const onDone = vi.fn();
    render(<CreateClusterView onDone={onDone} />);
    name(" prod_1 ");
    fireEvent.click(screen.getByText("Tags - optional"));
    fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    fireEvent.change(screen.getByLabelText("Tag key 1"), { target: { value: " team " } });
    fireEvent.change(screen.getByLabelText("Tag value 1"), { target: { value: "core" } });
    fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    create();
    expect(m.create).toHaveBeenCalledWith({ clusterName: "prod_1", tags: [{ key: "team", value: "core" }] }, expect.anything());
    const opts = m.create.mock.calls[0][1];
    opts.onSuccess();
    expect(m.toast).toHaveBeenCalledWith("success", "Cluster prod_1 has been created successfully.");
    expect(onDone).toHaveBeenCalled();
  });

  it("creates without tags and reports failures", () => {
    const onDone = vi.fn();
    render(<CreateClusterView onDone={onDone} />);
    name("dev");
    create();
    expect(m.create).toHaveBeenCalledWith({ clusterName: "dev" }, expect.anything());
    const opts = m.create.mock.calls[0][1];
    opts.onError(new Error("Exists"));
    expect(m.toast).toHaveBeenCalledWith("error", "Exists");
    opts.onError({});
    expect(m.toast).toHaveBeenCalledWith("error", "Failed to create cluster");
    expect(onDone).not.toHaveBeenCalled();
  });

  it("cancels", () => {
    const onDone = vi.fn();
    render(<CreateClusterView onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onDone).toHaveBeenCalled();
  });
});

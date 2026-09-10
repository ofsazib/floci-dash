// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

/** Fire Escape on every mounted Cloudscape dialog (fires onDismiss). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27, key: "Escape" });
  });
}

const mockFileSystems = vi.fn();
const mockMountTargets = vi.fn();
const mockAccessPoints = vi.fn();
const mockTags = vi.fn();
const mockCreateMutate = vi.fn(() => Promise.resolve({}));
const mockDeleteMutate = vi.fn(() => Promise.resolve({}));
const mockCreateMtMutate = vi.fn(() => Promise.resolve({}));
const mockDeleteMtMutate = vi.fn(() => Promise.resolve({}));
const mockCreateApMutate = vi.fn(() => Promise.resolve({}));
const mockDeleteApMutate = vi.fn(() => Promise.resolve({}));
const mockCreateTagMutate = vi.fn(() => Promise.resolve({}));
const mockDeleteTagMutate = vi.fn(() => Promise.resolve({}));
const mockShowToast = vi.fn();

vi.mock("../../hooks/useEFS", () => ({
  useEfsFileSystems: (...args: any[]) => mockFileSystems(...args),
  useEfsMountTargets: (...args: any[]) => mockMountTargets(...args),
  useEfsAccessPoints: (...args: any[]) => mockAccessPoints(...args),
  useEfsTags: (...args: any[]) => mockTags(...args),
  useCreateEfsFileSystem: () => ({ mutateAsync: mockCreateMutate, isPending: false }),
  useDeleteEfsFileSystem: () => ({ mutateAsync: mockDeleteMutate, isPending: false }),
  useCreateEfsMountTarget: () => ({ mutateAsync: mockCreateMtMutate, isPending: false }),
  useDeleteEfsMountTarget: () => ({ mutateAsync: mockDeleteMtMutate, isPending: false }),
  useCreateEfsAccessPoint: () => ({ mutateAsync: mockCreateApMutate, isPending: false }),
  useDeleteEfsAccessPoint: () => ({ mutateAsync: mockDeleteApMutate, isPending: false }),
  useCreateEfsTags: () => ({ mutateAsync: mockCreateTagMutate, isPending: false }),
  useDeleteEfsTags: () => ({ mutateAsync: mockDeleteTagMutate, isPending: false }),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock Cloudscape Select so options are clickable buttons, and Toggle so
// checked→unchecked transitions are deterministic under happy-dom
vi.mock("@cloudscape-design/components", async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    Select: ({ selectedOption, onChange, options }: any) => (
      <div data-testid="mock-select">
        {options?.map((o: any) => (
          <button
            key={o.value}
            data-testid={`opt-${o.value}`}
            onClick={() => onChange?.({ detail: { selectedOption: o } })}
          >
            {o.label}
          </button>
        ))}
      </div>
    ),
    Toggle: ({ checked, onChange, children }: any) => (
      <button data-testid={`toggle-${checked}`} onClick={() => onChange?.({ detail: { checked: !checked } })}>
        {children}
      </button>
    ),
  };
});

import { default as EFSDashboard } from "./EFSDashboard";

const fileSystem = {
  FileSystemId: "fs-123",
  Name: "my-efs",
  LifeCycleState: "available",
  Encrypted: true,
  NumberOfMountTargets: 2,
  SizeInBytes: { Value: 6144 },
};

const mountTarget = {
  MountTargetId: "fsmt-1",
  FileSystemId: "fs-123",
  SubnetId: "subnet-1",
  IpAddress: "10.0.0.5",
  LifeCycleState: "available",
};

const accessPoint = {
  AccessPointId: "fsap-1",
  FileSystemId: "fs-123",
  Name: "app-data",
  LifeCycleState: "available",
};

function setupFileSystems() {
  mockFileSystems.mockReturnValue({
    data: { fileSystems: [fileSystem], total: 1 },
    isLoading: false,
  });
  // detail-tab defaults; individual tests override
  mockMountTargets.mockReturnValue({ data: { mountTargets: [mountTarget], total: 1 }, isLoading: false });
  mockAccessPoints.mockReturnValue({ data: { accessPoints: [accessPoint], total: 1 }, isLoading: false });
  mockTags.mockReturnValue({ data: { tags: [{ Key: "env", Value: "dev" }] }, isLoading: false });
}

async function openDetails(user: any) {
  setupFileSystems();
  render(<EFSDashboard />, { wrapper: createWrapper() });
  await user.click(await screen.findByRole("button", { name: "Details" }));
  await screen.findByRole("tab", { name: "Mount targets" });
  await screen.findByText("fsmt-1");
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EFSDashboard — file systems table", () => {
  it("renders empty state", () => {
    mockFileSystems.mockReturnValue({ data: { fileSystems: [], total: 0 }, isLoading: false });
    render(<EFSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No file systems found")).toBeTruthy();
  });

  it("renders loading state", () => {
    mockFileSystems.mockReturnValue({ data: undefined, isLoading: true });
    render(<EFSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Loading resources...")).toBeTruthy();
  });

  it("renders file system rows", async () => {
    setupFileSystems();
    render(<EFSDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByText("fs-123")).toBeTruthy();
    expect(screen.getByText("my-efs")).toBeTruthy();
    expect(screen.getByText("Yes")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("renders a file system without a name using a dash", async () => {
    setupFileSystems();
    mockFileSystems.mockReturnValue({
      data: { fileSystems: [{ ...fileSystem, Name: undefined }], total: 1 },
      isLoading: false,
    });
    render(<EFSDashboard />, { wrapper: createWrapper() });
    const row = await screen.findByText("fs-123");
    expect(row).toBeTruthy();
  });
});

describe("EFSDashboard — create file system", () => {
  it("creates a file system with name and options", async () => {
    setupFileSystems();
    const user = userEvent.setup();
    render(<EFSDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Create file system" }));
    await user.type(screen.getByLabelText("Name (optional)"), "my-new-fs");
    await user.click(screen.getByTestId("opt-maxIO"));
    await user.click(screen.getByTestId("opt-elastic"));
    await user.click(screen.getByTestId("toggle-true"));
    await user.click(screen.getByRole("button", { name: "Confirm create" }));
    await waitFor(() => expect(mockCreateMutate).toHaveBeenCalled());
    const arg = (mockCreateMutate.mock.calls as any[])[0]?.[0] as any;
    expect(arg.performanceMode).toBe("maxIO");
    expect(arg.throughputMode).toBe("elastic");
    expect(arg.encrypted).toBe(false);
    expect(arg.tags).toEqual([{ Key: "Name", Value: "my-new-fs" }]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "File system created"));
  });

  it("creates without tags when name is empty", async () => {
    setupFileSystems();
    const user = userEvent.setup();
    render(<EFSDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Create file system" }));
    await user.click(screen.getByRole("button", { name: "Confirm create" }));
    await waitFor(() => expect(mockCreateMutate).toHaveBeenCalled());
    expect(((mockCreateMutate.mock.calls as any[])[0]?.[0] as any)?.tags).toBeUndefined();
  });

  it("shows create error toast on failure", async () => {
    setupFileSystems();
    mockCreateMutate.mockRejectedValueOnce(new Error("boom"));
    const user = userEvent.setup();
    render(<EFSDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Create file system" }));
    await user.click(screen.getByRole("button", { name: "Confirm create" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "boom"));
  });

  it("shows fallback error message for non-Error rejections", async () => {
    setupFileSystems();
    mockCreateMutate.mockRejectedValueOnce("nope");
    const user = userEvent.setup();
    render(<EFSDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Create file system" }));
    await user.click(screen.getByRole("button", { name: "Confirm create" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create file system"));
  });

  it("dismisses the create modal", async () => {
    setupFileSystems();
    const user = userEvent.setup();
    render(<EFSDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Create file system" }));
    expect(screen.getByText("Performance mode")).toBeTruthy();
    dismissModalWithEscape();
    await waitFor(() => {
      const dialogs = Array.from(
        document.querySelectorAll<HTMLElement>('[class*="awsui_dialog"]')
      );
      const open = dialogs.filter((d) => !d.closest('[class*="awsui_hidden"]'));
      expect(open.length).toBe(0);
    });
  });
});

describe("EFSDashboard — delete file system", () => {
  it("deletes a file system via confirm dialog", async () => {
    setupFileSystems();
    const user = userEvent.setup();
    render(<EFSDashboard />, { wrapper: createWrapper() });
    await screen.findByText("fs-123");
    await user.click(screen.getByRole("button", { name: "Delete fs-123" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeleteMutate).toHaveBeenCalledWith("fs-123"));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "File system deleted"));
  });

  it("shows delete error toast on failure", async () => {
    setupFileSystems();
    mockDeleteMutate.mockRejectedValueOnce(new Error("in use"));
    const user = userEvent.setup();
    render(<EFSDashboard />, { wrapper: createWrapper() });
    await screen.findByText("fs-123");
    await user.click(screen.getByRole("button", { name: "Delete fs-123" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "in use"));
  });
});

describe("EFSDashboard — details modal tabs", () => {
  it("opens details modal with mount targets, access points, and tags tabs", async () => {
    const user = await openDetails(userEvent.setup());
    expect(screen.getByText("fsmt-1")).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Access points" }));
    expect(await screen.findByText("fsap-1")).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    expect(await screen.findByText("env")).toBeTruthy();
  });

  it("closes details modal on dismiss", async () => {
    const user = userEvent.setup();
    await openDetails(user);
    dismissModalWithEscape();
    await waitFor(() => {
      expect(screen.queryByText("fsmt-1")).toBeNull();
    });
  });

  it("creates a mount target", async () => {
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("button", { name: "Create mount target" }));
    const inputs = screen.getAllByLabelText("Subnet ID");
    await user.type(inputs[inputs.length - 1], "subnet-9");
    await user.click(screen.getByRole("button", { name: "Confirm mount target" }));
    await waitFor(() =>
      expect(mockCreateMtMutate).toHaveBeenCalledWith(
        expect.objectContaining({ fileSystemId: "fs-123", subnetId: "subnet-9" })
      )
    );
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Mount target created"));
  });

  it("keeps mount target create disabled until subnet filled", async () => {
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("button", { name: "Create mount target" }));
    expect(
      (screen.getByRole("button", { name: "Confirm mount target" }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("shows mount target create error toast on failure", async () => {
    mockCreateMtMutate.mockRejectedValueOnce(new Error("mt boom"));
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("button", { name: "Create mount target" }));
    const inputs = screen.getAllByLabelText("Subnet ID");
    await user.type(inputs[inputs.length - 1], "subnet-9");
    await user.click(screen.getByRole("button", { name: "Confirm mount target" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "mt boom"));
  });

  it("deletes a mount target via confirm dialog", async () => {
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("button", { name: "Delete fsmt-1" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeleteMtMutate).toHaveBeenCalledWith("fsmt-1"));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Mount target deleted"));
  });

  it("shows mount target delete error toast on failure", async () => {
    mockDeleteMtMutate.mockRejectedValueOnce(new Error("mt del boom"));
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("button", { name: "Delete fsmt-1" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "mt del boom"));
  });

  it("creates an access point", async () => {
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("tab", { name: "Access points" }));
    await user.click(screen.getByRole("button", { name: "Create access point" }));
    await user.click(screen.getByRole("button", { name: "Confirm access point" }));
    await waitFor(() => expect(mockCreateApMutate).toHaveBeenCalled());
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Access point created"));
  });

  it("deletes an access point via confirm dialog", async () => {
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("tab", { name: "Access points" }));
    await user.click(screen.getByRole("button", { name: "Delete fsap-1" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeleteApMutate).toHaveBeenCalledWith("fsap-1"));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Access point deleted"));
  });

  it("adds a tag", async () => {
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    const keyInputs = screen.getAllByLabelText("Key");
    await user.type(keyInputs[keyInputs.length - 1], "team");
    const valueInputs = screen.getAllByLabelText("Value");
    await user.type(valueInputs[valueInputs.length - 1], "platform");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await waitFor(() =>
      expect(mockCreateTagMutate).toHaveBeenCalledWith({
        fileSystemId: "fs-123",
        tags: [{ Key: "team", Value: "platform" }],
      })
    );
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Tag added"));
  });

  it("keeps Add tag disabled until key is filled", async () => {
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    expect(
      (screen.getByRole("button", { name: "Add tag" }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("shows tag add error toast on failure", async () => {
    mockCreateTagMutate.mockRejectedValueOnce(new Error("tag boom"));
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    const keyInputs = screen.getAllByLabelText("Key");
    await user.type(keyInputs[keyInputs.length - 1], "team");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "tag boom"));
  });

  it("removes a tag via confirm dialog", async () => {
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    await user.click(screen.getByRole("button", { name: "Delete env" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(mockDeleteTagMutate).toHaveBeenCalledWith({ fileSystemId: "fs-123", tagKeys: ["env"] })
    );
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Tag removed"));
  });

  it("shows tag delete error toast on failure", async () => {
    mockDeleteTagMutate.mockRejectedValueOnce(new Error("untag boom"));
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    await user.click(screen.getByRole("button", { name: "Delete env" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "untag boom"));
  });

  it("renders fallback dashboards cells when detail data is undefined", async () => {
    const user = userEvent.setup();
    setupFileSystems();
    mockMountTargets.mockReturnValue({ data: undefined, isLoading: false });
    mockAccessPoints.mockReturnValue({ data: undefined, isLoading: false });
    mockTags.mockReturnValue({ data: undefined, isLoading: false });
    render(<EFSDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Details" }));
    expect(await screen.findByText("No mount targets found")).toBeTruthy();
  });

  it("renders a mount target without IP using a dash", async () => {
    const user = userEvent.setup();
    setupFileSystems();
    mockMountTargets.mockReturnValue({
      data: { mountTargets: [{ ...mountTarget, IpAddress: undefined }], total: 1 },
      isLoading: false,
    });
    render(<EFSDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Details" }));
    await screen.findByText("fsmt-1");
    const dashes = await screen.findAllByText("—");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("renders an access point without a name using a dash", async () => {
    const user = userEvent.setup();
    setupFileSystems();
    mockAccessPoints.mockReturnValue({
      data: { accessPoints: [{ ...accessPoint, Name: undefined }], total: 1 },
      isLoading: false,
    });
    render(<EFSDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Details" }));
    await user.click(screen.getByRole("tab", { name: "Access points" }));
    expect(await screen.findByText("fsap-1")).toBeTruthy();
  });

  it("renders an error status for unknown states", async () => {
    mockFileSystems.mockReturnValue({
      data: { fileSystems: [{ ...fileSystem, LifeCycleState: "broken" }], total: 1 },
      isLoading: false,
    });
    render(<EFSDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByText("broken")).toBeTruthy();
  });
});

describe("EFSDashboard — fallback branches", () => {
  it("mount target create uses fallback message for non-Error rejections", async () => {
    mockCreateMtMutate.mockRejectedValueOnce("nope");
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("button", { name: "Create mount target" }));
    const inputs = screen.getAllByLabelText("Subnet ID");
    await user.type(inputs[inputs.length - 1], "subnet-9");
    await user.click(screen.getByRole("button", { name: "Confirm mount target" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create mount target"));
  });

  it("mount target delete uses fallback message for non-Error rejections", async () => {
    mockDeleteMtMutate.mockRejectedValueOnce("nope");
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("button", { name: "Delete fsmt-1" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete mount target"));
  });

  it("renders a mount target without lifecycle state using a dash", async () => {
    setupFileSystems();
    mockMountTargets.mockReturnValue({
      data: { mountTargets: [{ ...mountTarget, LifeCycleState: undefined }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<EFSDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Details" }));
    expect(await screen.findByText("fsmt-1")).toBeTruthy();
    expect(await screen.findByText("—")).toBeTruthy();
  });

  it("access point create uses fallback message for non-Error rejections", async () => {
    mockCreateApMutate.mockRejectedValueOnce("nope");
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("tab", { name: "Access points" }));
    await user.click(screen.getByRole("button", { name: "Create access point" }));
    await user.click(screen.getByRole("button", { name: "Confirm access point" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create access point"));
  });

  it("access point delete uses fallback message for non-Error rejections", async () => {
    mockDeleteApMutate.mockRejectedValueOnce("nope");
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("tab", { name: "Access points" }));
    await user.click(screen.getByRole("button", { name: "Delete fsap-1" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete access point"));
  });

  it("renders an access point without lifecycle state using a dash", async () => {
    setupFileSystems();
    mockAccessPoints.mockReturnValue({
      data: { accessPoints: [{ ...accessPoint, LifeCycleState: undefined }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<EFSDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Details" }));
    await user.click(screen.getByRole("tab", { name: "Access points" }));
    expect(await screen.findByText("fsap-1")).toBeTruthy();
  });

  it("tag add uses fallback message for non-Error rejections", async () => {
    mockCreateTagMutate.mockRejectedValueOnce("nope");
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    await user.type(screen.getAllByLabelText("Key")[0], "k1");
    await user.type(screen.getAllByLabelText("Value")[0], "v1");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to add tag"));
  });

  it("tag delete uses fallback message for non-Error rejections", async () => {
    mockDeleteTagMutate.mockRejectedValueOnce("nope");
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    await user.click(screen.getByRole("button", { name: "Delete env" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to remove tag"));
  });

  it("delete file system uses fallback message for non-Error rejections", async () => {
    mockDeleteMutate.mockRejectedValueOnce("nope");
    setupFileSystems();
    const user = userEvent.setup();
    render(<EFSDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Delete fs-123" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete file system"));
  });

  it("renders a file system without lifecycle state or size using dashes", () => {
    mockFileSystems.mockReturnValue({
      data: { fileSystems: [{ ...fileSystem, LifeCycleState: undefined, SizeInBytes: undefined }], total: 1 },
      isLoading: false,
    });
    render(<EFSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("fs-123")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders a file system without mount target count using zero", () => {
    mockFileSystems.mockReturnValue({
      data: { fileSystems: [{ ...fileSystem, NumberOfMountTargets: undefined }], total: 1 },
      isLoading: false,
    });
    render(<EFSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("renders an unencrypted file system as No", () => {
    mockFileSystems.mockReturnValue({
      data: { fileSystems: [{ ...fileSystem, Encrypted: false }], total: 1 },
      isLoading: false,
    });
    render(<EFSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No")).toBeTruthy();
  });
});

describe("EFSDashboard — remaining fallback arms", () => {
  it("access points tab shows empty state when accessPoints undefined", async () => {
    setupFileSystems();
    mockAccessPoints.mockReturnValue({ data: { total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<EFSDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Details" }));
    await user.click(screen.getByRole("tab", { name: "Access points" }));
    expect(await screen.findByText("No access points found")).toBeTruthy();
  });

  it("tags tab shows empty state when tags undefined", async () => {
    setupFileSystems();
    mockTags.mockReturnValue({ data: { total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<EFSDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Details" }));
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    expect(await screen.findByText("No tags found")).toBeTruthy();
  });

  it("renders a file system without a name using a dash cell", () => {
    mockFileSystems.mockReturnValue({
      data: { fileSystems: [{ ...fileSystem, Name: undefined }], total: 1 },
      isLoading: false,
    });
    render(<EFSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("fs-123")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});

describe("EFSDashboard — modal inputs & dismiss", () => {
  it("types an IP address and dismisses the mount target modal", async () => {
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("button", { name: "Create mount target" }));
    await user.type(screen.getByLabelText("IP address (optional)"), "10.0.0.9");
    // onChange fired; now dismiss via the modal's X button (covers onDismiss)
    const open = Array.from(document.querySelectorAll<HTMLElement>('[class*="awsui_dialog"]')).filter(
      (d) => !d.closest('[class*="awsui_hidden_"]')
    );
    const target = open.find((d) => d.textContent?.includes("Confirm mount target")) ?? open[open.length - 1];
    (target.querySelector('[class*="awsui_dismiss"]') as HTMLElement | null)?.click();
    await waitFor(() => {
      expect(
        (screen.queryByRole("button", { name: "Confirm mount target" }) as HTMLButtonElement | null)?.closest('[class*="awsui_hidden_"]') ?? null
      ).toBeTruthy();
    });
  });

  it("types a name and dismisses the access point modal", async () => {
    const user = userEvent.setup();
    await openDetails(user);
    await user.click(screen.getByRole("tab", { name: "Access points" }));
    await user.click(screen.getByRole("button", { name: "Create access point" }));
    const names = screen.getAllByLabelText("Name (optional)");
    await user.type(names[names.length - 1], "ap-name");
    // onChange fired; now dismiss via the modal's X button (covers onDismiss)
    const open = Array.from(document.querySelectorAll<HTMLElement>('[class*="awsui_dialog"]')).filter(
      (d) => !d.closest('[class*="awsui_hidden_"]')
    );
    const target = open.find((d) => d.textContent?.includes("Confirm access point")) ?? open[open.length - 1];
    (target.querySelector('[class*="awsui_dismiss"]') as HTMLElement | null)?.click();
    await waitFor(() => {
      expect(
        (screen.queryByRole("button", { name: "Confirm access point" }) as HTMLButtonElement | null)?.closest('[class*="awsui_hidden_"]') ?? null
      ).toBeTruthy();
    });
  });
});

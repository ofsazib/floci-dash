// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useSesCreateExportJob: vi.fn(),
  useSesListExportJobs: vi.fn(),
  useSesCancelExportJob: vi.fn(),
  useSesCreateImportJob: vi.fn(),
  useSesListImportJobs: vi.fn(),
  useSesBatchGetMetricData: vi.fn(),
  useSesMessageInsights: vi.fn(),
  useSesListDedicatedIps: vi.fn(),
  useSesPutPoolScaling: vi.fn(),
  useSesCreateTenant: vi.fn(),
  useSesListTenants: vi.fn(),
  useSesDeleteTenant: vi.fn(),
  useSesAssociateTenantResource: vi.fn(),
  useSesDisassociateTenantResource: vi.fn(),
  useSesListTenantResources: vi.fn(),
}));

vi.mock("../../hooks/useSesV2Extras", () => mockHooks);

const mockCreateExport = vi.fn();
const mockListExport = vi.fn();
const mockCancelExport = vi.fn();
const mockCreateImport = vi.fn();
const mockListImport = vi.fn();
const mockMetrics = vi.fn();
const mockInsights = vi.fn();
const mockListIps = vi.fn();
const mockScaling = vi.fn();
const mockCreateTenant = vi.fn();
const mockListTenants = vi.fn();
const mockDeleteTenant = vi.fn();
const mockAssociateRes = vi.fn();
const mockDisassociateRes = vi.fn();
const mockListTenantResources = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

const EXPORT_JOB = { jobId: "job-1", jobStatus: "COMPLETED" };
const IMPORT_JOB = { jobId: "ijob-1", importJobStatus: "COMPLETED" };
const TENANT = { tenantName: "marketing", tenantArn: "arn:tenant" };

import SesExtrasPanel from "./SesExtrasPanel";

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useSesCreateExportJob.mockReturnValue(okMutation(mockCreateExport));
  mockHooks.useSesListExportJobs.mockReturnValue(okMutation(mockListExport));
  mockHooks.useSesCancelExportJob.mockReturnValue(okMutation(mockCancelExport));
  mockHooks.useSesCreateImportJob.mockReturnValue(okMutation(mockCreateImport));
  mockHooks.useSesListImportJobs.mockReturnValue(okMutation(mockListImport));
  mockHooks.useSesBatchGetMetricData.mockReturnValue(okMutation(mockMetrics));
  mockHooks.useSesMessageInsights.mockReturnValue(okMutation(mockInsights));
  mockHooks.useSesListDedicatedIps.mockReturnValue(okMutation(mockListIps));
  mockHooks.useSesPutPoolScaling.mockReturnValue(okMutation(mockScaling));
  mockHooks.useSesCreateTenant.mockReturnValue(okMutation(mockCreateTenant));
  mockHooks.useSesListTenants.mockReturnValue(okMutation(mockListTenants));
  mockHooks.useSesDeleteTenant.mockReturnValue(okMutation(mockDeleteTenant));
  mockHooks.useSesAssociateTenantResource.mockReturnValue(okMutation(mockAssociateRes));
  mockHooks.useSesDisassociateTenantResource.mockReturnValue(
    okMutation(mockDisassociateRes)
  );
  mockHooks.useSesListTenantResources.mockReturnValue(okMutation(mockListTenantResources));
});

describe("SesExtrasPanel — export jobs", () => {
  it("creates a CSV export job", async () => {
    const user = userEvent.setup();
    mockCreateExport.mockResolvedValueOnce({ jobId: "job-1" });
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create CSV export/i }));
    await waitFor(() =>
      expect(mockCreateExport).toHaveBeenCalledWith({
        exportDestination: { dataFormat: "CSV" },
        exportDataSource: { metricsDataSource: { dimensions: {} } },
      })
    );
    await waitFor(() => expect(screen.getByText("Export job created.")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Export job created.")).toBeNull()
    );
  });

  it("shows a fallback error when the export creation fails", async () => {
    const user = userEvent.setup();
    mockCreateExport.mockRejectedValueOnce({});
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create CSV export/i }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("lists export jobs and cancels one", async () => {
    const user = userEvent.setup();
    mockListExport.mockResolvedValueOnce({ jobs: [EXPORT_JOB] });
    mockCancelExport.mockResolvedValueOnce({ cancelled: true });
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /List export jobs/i }));
    await waitFor(() => expect(screen.getByText("job-1")).toBeTruthy());
    expect(screen.getByText("COMPLETED")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /^Cancel$/ }));
    await waitFor(() => expect(mockCancelExport).toHaveBeenCalledWith("job-1"));
    await waitFor(() =>
      expect(screen.getByText("Export job job-1 cancelled.")).toBeTruthy()
    );
  });

  it("renders the empty message when no export jobs exist", async () => {
    const user = userEvent.setup();
    mockListExport.mockResolvedValueOnce({ jobs: [] });
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /List export jobs/i }));
    await waitFor(() => expect(screen.getByText("No export jobs")).toBeTruthy());
  });
});

describe("SesExtrasPanel — import jobs", () => {
  it("creates a suppression import job and lists import jobs", async () => {
    const user = userEvent.setup();
    mockCreateImport.mockResolvedValueOnce({ jobId: "ijob-1" });
    mockListImport.mockResolvedValueOnce({ importJobs: [IMPORT_JOB] });
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create suppression import/i }));
    await waitFor(() =>
      expect(mockCreateImport).toHaveBeenCalledWith({
        importDataSource: { s3Url: "s3://floci-import/sample.csv", dataFormat: "CSV" },
        importDestination: {
          suppressionListDestination: { suppressionListImportAction: "PUT" },
        },
      })
    );
    await user.click(screen.getByRole("button", { name: /List import jobs/i }));
    await waitFor(() => expect(screen.getByText("ijob-1")).toBeTruthy());
    expect(screen.getByText("COMPLETED")).toBeTruthy();
  });

  it("renders the empty message when no import jobs exist", async () => {
    const user = userEvent.setup();
    mockListImport.mockResolvedValueOnce({ importJobs: [] });
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /List import jobs/i }));
    await waitFor(() => expect(screen.getByText("No import jobs")).toBeTruthy());
  });
});

describe("SesExtrasPanel — metrics and insights", () => {
  it("runs a SEND metric query and shows the raw result", async () => {
    const user = userEvent.setup();
    mockMetrics.mockResolvedValueOnce({ results: [{ id: "send-series" }], errors: [] });
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /BatchGetMetricData/i }));
    await waitFor(() =>
      expect(mockMetrics).toHaveBeenCalledWith([
        { id: "send-series", metric: "SEND", namespace: "VDM" },
      ])
    );
    await waitFor(() =>
      expect(screen.getByText(/"send-series"/)).toBeTruthy()
    );
  });

  it("disables insights until a message id is typed, then shows the result", async () => {
    const user = userEvent.setup();
    mockInsights.mockResolvedValueOnce({ insights: { messageId: "mid-1" } });
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    const insightsBtn = screen.getByRole("button", { name: /Get insights/i }) as HTMLButtonElement;
    expect(insightsBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("mid-123"), "mid-1");
    expect(insightsBtn.disabled).toBe(false);
    await user.click(insightsBtn);
    await waitFor(() => expect(mockInsights).toHaveBeenCalledWith("mid-1"));
    await waitFor(() => expect(screen.getByText(/"messageId":\s*"mid-1"/)).toBeTruthy());
  });

  it("shows a fallback error when insights fail", async () => {
    const user = userEvent.setup();
    mockInsights.mockRejectedValueOnce({});
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("mid-123"), "mid-1");
    await user.click(screen.getByRole("button", { name: /Get insights/i }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });
});

describe("SesExtrasPanel — dedicated IPs", () => {
  it("disables IP actions until a pool name is typed, then lists IPs", async () => {
    const user = userEvent.setup();
    mockListIps.mockResolvedValueOnce({ dedicatedIps: [{ ip: "1.2.3.4", status: "DONE" }] });
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    const listBtn = screen.getByRole("button", { name: /^List IPs$/i }) as HTMLButtonElement;
    const scaleBtn = screen.getByRole("button", { name: /^Set scaling$/i }) as HTMLButtonElement;
    expect(listBtn.disabled).toBe(true);
    expect(scaleBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("my-pool"), "pool-1");
    expect(listBtn.disabled).toBe(false);
    await user.click(listBtn);
    await waitFor(() => expect(mockListIps).toHaveBeenCalledWith("pool-1"));
    await waitFor(() => expect(screen.getByText("1.2.3.4")).toBeTruthy());
  });

  it("renders the no-IPs message", async () => {
    const user = userEvent.setup();
    mockListIps.mockResolvedValueOnce({ dedicatedIps: [] });
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-pool"), "pool-1");
    await user.click(screen.getByRole("button", { name: /^List IPs$/i }));
    await waitFor(() =>
      expect(screen.getByText(/No dedicated IPs/)).toBeTruthy()
    );
  });

  it("sets the pool scaling mode", async () => {
    const user = userEvent.setup();
    mockScaling.mockResolvedValueOnce({ updated: true });
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-pool"), "pool-1");
    await user.click(screen.getByRole("button", { name: /^Set scaling$/i }));
    await waitFor(() =>
      expect(mockScaling).toHaveBeenCalledWith({ name: "pool-1", scalingMode: "MANAGED" })
    );
    await waitFor(() =>
      expect(screen.getByText("Scaling mode of pool-1 set to MANAGED.")).toBeTruthy()
    );
  });

  it("accepts a custom scaling mode", async () => {
    const user = userEvent.setup();
    mockScaling.mockResolvedValueOnce({ updated: true });
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-pool"), "pool-1");
    const modeInput = screen
      .getAllByRole("textbox")
      .find((el) => (el as HTMLInputElement).value === "MANAGED") as HTMLElement;
    await user.clear(modeInput);
    await user.type(modeInput, "STANDARD");
    await user.click(screen.getByRole("button", { name: /^Set scaling$/i }));
    await waitFor(() =>
      expect(mockScaling).toHaveBeenCalledWith({ name: "pool-1", scalingMode: "STANDARD" })
    );
  });

  it("shows a fallback error when scaling fails", async () => {
    const user = userEvent.setup();
    mockScaling.mockRejectedValueOnce({});
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-pool"), "pool-1");
    await user.click(screen.getByRole("button", { name: /^Set scaling$/i }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });
});

describe("SesExtrasPanel — tenants", () => {
  it("creates a tenant, lists tenants, and deletes one", async () => {
    const user = userEvent.setup();
    mockCreateTenant.mockResolvedValueOnce({ tenant: { tenantName: "marketing" } });
    mockListTenants.mockResolvedValue({ tenants: [TENANT] });
    mockDeleteTenant.mockResolvedValueOnce({ deleted: true });
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    const createBtn = screen.getByRole("button", { name: /^Create$/ }) as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("marketing"), "marketing");
    expect(createBtn.disabled).toBe(false);
    await user.click(createBtn);
    await waitFor(() =>
      expect(mockCreateTenant).toHaveBeenCalledWith({ tenantName: "marketing" })
    );
    await waitFor(() =>
      expect(screen.getByText("Tenant marketing created.")).toBeTruthy()
    );
    await user.click(screen.getByRole("button", { name: /^List tenants$/i }));
    await waitFor(() => expect(screen.getByText("marketing")).toBeTruthy());
    expect(screen.getByText("arn:tenant")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));
    await waitFor(() => expect(mockDeleteTenant).toHaveBeenCalledWith("marketing"));
    await waitFor(() =>
      expect(screen.getByText("Tenant marketing deleted.")).toBeTruthy()
    );
    await waitFor(() => expect(screen.queryByText("arn:tenant")).toBeNull());
  });

  it("renders the empty message when no tenants exist", async () => {
    const user = userEvent.setup();
    mockListTenants.mockResolvedValueOnce({ tenants: [] });
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^List tenants$/i }));
    await waitFor(() => expect(screen.getByText("No tenants")).toBeTruthy());
  });
});

describe("SesExtrasPanel — tenant resources", () => {
  async function typeTenantResource(user: ReturnType<typeof userEvent.setup>) {
    const inputs = screen.getAllByPlaceholderText("arn:aws:ses:...");
    await user.type(
      screen.getAllByRole("textbox").find((el) => {
        return true;
      }) as HTMLElement,
      ""
    );
    // Fill the two association inputs directly by order: tenant name input is
    // the last textbox whose value is empty at panel bottom; use placeholders.
    await user.type(inputs[0], "arn:aws:ses:us-east-1:0:identity/x@y.z");
  }

  it("associates and disassociates a resource", async () => {
    const user = userEvent.setup();
    mockAssociateRes.mockResolvedValueOnce({ associated: true });
    mockDisassociateRes.mockResolvedValueOnce({ disassociated: true });
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("resource-tenant"), "t1");
    await user.type(
      screen.getByPlaceholderText("arn:aws:ses:..."),
      "arn:identity"
    );
    await user.click(screen.getByRole("button", { name: /^Associate$/ }));
    await waitFor(() =>
      expect(mockAssociateRes).toHaveBeenCalledWith({
        tenantName: "t1",
        resourceArn: "arn:identity",
      })
    );
    await waitFor(() => expect(screen.getByText("Resource associated.")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Disassociate$/ }));
    await waitFor(() =>
      expect(mockDisassociateRes).toHaveBeenCalledWith({
        tenantName: "t1",
        resourceArn: "arn:identity",
      })
    );
  });

  it("lists tenant resources and shows the empty message", async () => {
    const user = userEvent.setup();
    mockListTenantResources.mockResolvedValueOnce({
      resources: [{ resourceArn: "arn:identity", resourceType: "identity" }],
    });
    render(<SesExtrasPanel />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("resource-tenant"), "t1");
    await user.click(screen.getByRole("button", { name: /^List resources$/ }));
    await waitFor(() =>
      expect(mockListTenantResources).toHaveBeenCalledWith({ tenantName: "t1" })
    );
    await waitFor(() => expect(screen.getByText("arn:identity")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("identity")).toBeTruthy());
    // Relist with an empty result to render the empty message.
    mockListTenantResources.mockResolvedValueOnce({ resources: [] });
    await user.click(screen.getByRole("button", { name: /^List resources$/ }));
    await waitFor(() =>
      expect(
        screen.getByText("No resources associated with this tenant")
      ).toBeTruthy()
    );
  });
});

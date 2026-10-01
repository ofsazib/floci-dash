// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useSmModels: vi.fn(),
  useCreateSmModel: vi.fn(),
  useDeleteSmModel: vi.fn(),
  useSmEndpointConfigs: vi.fn(),
  useCreateSmEndpointConfig: vi.fn(),
  useDeleteSmEndpointConfig: vi.fn(),
  useSmEndpoints: vi.fn(),
  useCreateSmEndpoint: vi.fn(),
  useUpdateSmEndpoint: vi.fn(),
  useDeleteSmEndpoint: vi.fn(),
  useSmTrainingJobs: vi.fn(),
  useCreateSmTrainingJob: vi.fn(),
  useStopSmTrainingJob: vi.fn(),
}));

vi.mock("../../hooks/useSageMaker", () => mockHooks);

const mockCreateModel = vi.fn();
const mockDeleteModel = vi.fn();
const mockCreateConfig = vi.fn();
const mockDeleteConfig = vi.fn();
const mockCreateEndpoint = vi.fn();
const mockUpdateEndpoint = vi.fn();
const mockDeleteEndpoint = vi.fn();
const mockCreateJob = vi.fn();
const mockStopJob = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

function listQuery(key: string, items: unknown[], overrides: Record<string, unknown> = {}) {
  return {
    data: { [key]: items, total: items.length },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

const MODEL = { ModelName: "m1", ModelArn: "arn:m1" };
const CONFIG = { EndpointConfigName: "cfg1", EndpointConfigArn: "arn:cfg1" };
const ENDPOINT = {
  EndpointName: "ep1",
  EndpointArn: "arn:ep1",
  EndpointStatus: "InService",
  EndpointConfigName: "cfg1",
};
const JOB = { TrainingJobName: "job1", TrainingJobArn: "arn:job1", TrainingJobStatus: "Completed" };

import SageMakerDashboard from "./SageMakerDashboard";

function dialogButton(dlg: HTMLElement, text: string): HTMLElement {
  return Array.from(dlg.querySelectorAll("button")).find(
    (b) => b.textContent === text
  ) as HTMLElement;
}

function modalDlg(header: string): HTMLElement {
  return screen
    .getAllByText(header)
    .map((t) => t.closest('[role="dialog"]'))
    .find((d) => d) as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useSmModels.mockReturnValue(listQuery("models", [MODEL]));
  mockHooks.useSmEndpointConfigs.mockReturnValue(listQuery("configs", [CONFIG]));
  mockHooks.useSmEndpoints.mockReturnValue(listQuery("endpoints", [ENDPOINT]));
  mockHooks.useSmTrainingJobs.mockReturnValue(listQuery("jobs", [JOB]));
  mockHooks.useCreateSmModel.mockReturnValue(okMutation(mockCreateModel));
  mockHooks.useDeleteSmModel.mockReturnValue(okMutation(mockDeleteModel));
  mockHooks.useCreateSmEndpointConfig.mockReturnValue(okMutation(mockCreateConfig));
  mockHooks.useDeleteSmEndpointConfig.mockReturnValue(okMutation(mockDeleteConfig));
  mockHooks.useCreateSmEndpoint.mockReturnValue(okMutation(mockCreateEndpoint));
  mockHooks.useUpdateSmEndpoint.mockReturnValue(okMutation(mockUpdateEndpoint));
  mockHooks.useDeleteSmEndpoint.mockReturnValue(okMutation(mockDeleteEndpoint));
  mockHooks.useCreateSmTrainingJob.mockReturnValue(okMutation(mockCreateJob));
  mockHooks.useStopSmTrainingJob.mockReturnValue(okMutation(mockStopJob));
});

describe("SageMakerDashboard — models tab", () => {
  it("renders models", async () => {
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("m1")).toBeTruthy());
  });

  it("creates a model and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockCreateModel.mockResolvedValueOnce({ modelArn: "arn" });
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create model/i }));
    const dlg = modalDlg("Create model");
    await user.type(dlg.querySelector('input[placeholder="my-model"]') as HTMLElement, "m2");
    await user.type(
      dlg.querySelector('input[placeholder="1234.dkr.ecr.us-east-1.amazonaws.com/m:1"]') as HTMLElement,
      "img:1"
    );
    await user.type(
      dlg.querySelector('input[placeholder="arn:aws:iam::123456789012:role/…"]') as HTMLElement,
      "role"
    );
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreateModel).toHaveBeenCalledWith({
        modelName: "m2",
        primaryContainer: { Image: "img:1" },
        executionRoleArn: "role",
      })
    );
    await waitFor(() => expect(screen.getByText("Model m2 created.")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() => expect(screen.queryByText("Model m2 created.")).toBeNull());
  });

  it("keeps model Create disabled until all fields are filled and closes on Cancel", async () => {
    const user = userEvent.setup();
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create model/i }));
    const dlg = screen
      .getAllByText("Model name")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const createBtn = Array.from(dlg.querySelectorAll("button")).find(
      (b) => b.textContent === "Create"
    ) as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    const cancelBtn = Array.from(dlg.querySelectorAll("button")).find(
      (b) => b.textContent === "Cancel"
    ) as HTMLElement;
    await user.click(cancelBtn);
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("shows a fallback error when model creation fails", async () => {
    const user = userEvent.setup();
    mockCreateModel.mockRejectedValueOnce({});
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create model/i }));
    const dlg = modalDlg("Create model");
    await user.type(dlg.querySelector('input[placeholder="my-model"]') as HTMLElement, "m2");
    await user.type(
      dlg.querySelector('input[placeholder="1234.dkr.ecr.us-east-1.amazonaws.com/m:1"]') as HTMLElement,
      "img:1"
    );
    await user.type(
      dlg.querySelector('input[placeholder="arn:aws:iam::123456789012:role/…"]') as HTMLElement,
      "role"
    );
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("deletes a model after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteModel.mockResolvedValueOnce({ ok: true });
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("m1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete m1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteModel).toHaveBeenCalledWith("m1"));
  });

  it("renders the models error alert", () => {
    mockHooks.useSmModels.mockReturnValue(
      listQuery("models", [], { isError: true, error: new Error("down") })
    );
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("down")).toBeTruthy();
  });

  it("renders dash arms for undefined model data and models without error message", () => {
    mockHooks.useSmModels.mockReturnValue(
      listQuery("models", [], { data: undefined, isError: true, error: null })
    );
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Models (0)")).toBeTruthy();
    expect(screen.getByText("Failed to load models")).toBeTruthy();
  });
});

describe("SageMakerDashboard — endpoint configs tab", () => {
  it("lists configs", async () => {
    const user = userEvent.setup();
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Endpoint configs/ }));
    await waitFor(() => expect(screen.getByText("cfg1")).toBeTruthy());
  });

  it("creates a config from the modal", async () => {
    const user = userEvent.setup();
    mockCreateConfig.mockResolvedValueOnce({ endpointConfigArn: "arn" });
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Endpoint configs/ }));
    await user.click(screen.getByRole("button", { name: /Create endpoint config/i }));
    const dlg = screen
      .getAllByText("Config name")
      .map((t) => t.closest('[role="dialog"]'))
      .find((d) => d) as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "cfg2");
    await user.type(inputs[1] as HTMLElement, "img:2");
    await user.type(inputs[2] as HTMLElement, "ml.m5.large");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreateConfig).toHaveBeenCalledWith({
        endpointConfigName: "cfg2",
        productionVariants: [
          {
            ModelName: "cfg2",
            InstanceType: "ml.t2.mediumml.m5.large",
            InitialInstanceCount: 1,
            VariantName: "AllTraffic",
          },
        ],
      })
    );
  });

  it("shows the empty configs message and renders undefined data", async () => {
    const user = userEvent.setup();
    mockHooks.useSmEndpointConfigs.mockReturnValue(
      listQuery("configs", [], { data: undefined })
    );
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Endpoint configs/ }));
    await waitFor(() => expect(screen.getByText("No endpoint configs found")).toBeTruthy());
  });

  it("closes the config modal via Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Endpoint configs/ }));
    await user.click(screen.getByRole("button", { name: /Create endpoint config/i }));
    let dlg = modalDlg("Create endpoint config");
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create endpoint config/i }));
    dlg = modalDlg("Create endpoint config");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("deletes a config after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteConfig.mockResolvedValueOnce({ ok: true });
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Endpoint configs/ }));
    await waitFor(() => expect(screen.getByText("cfg1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete cfg1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteConfig).toHaveBeenCalledWith("cfg1"));
  });
});

describe("SageMakerDashboard — endpoints tab", () => {
  it("lists endpoints with status and config", async () => {
    const user = userEvent.setup();
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Endpoints/ }));
    await waitFor(() => expect(screen.getByText("ep1")).toBeTruthy());
    expect(screen.getByText("InService")).toBeTruthy();
  });

  it("warns when updating an endpoint with no configs available", async () => {
    const user = userEvent.setup();
    mockHooks.useSmEndpointConfigs.mockReturnValue(listQuery("configs", []));
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Endpoints/ }));
    await waitFor(() => expect(screen.getByText("ep1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Update$/i }));
    await waitFor(() =>
      expect(screen.getByText("Create an endpoint config first.")).toBeTruthy()
    );
  });

  it("updates an endpoint to the first available config", async () => {
    const user = userEvent.setup();
    mockUpdateEndpoint.mockResolvedValueOnce({ endpointArn: "arn" });
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Endpoints/ }));
    await user.click(screen.getByRole("button", { name: /^Update$/i }));
    await waitFor(() =>
      expect(mockUpdateEndpoint).toHaveBeenCalledWith({
        endpointName: "ep1",
        endpointConfigName: "cfg1",
      })
    );
  });

  it("shows the empty endpoints message and renders undefined data", async () => {
    const user = userEvent.setup();
    mockHooks.useSmEndpoints.mockReturnValue(
      listQuery("endpoints", [], { data: undefined })
    );
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Endpoints/ }));
    await waitFor(() => expect(screen.getByText("No endpoints found")).toBeTruthy());
  });

  it("creates an endpoint from the modal", async () => {
    const user = userEvent.setup();
    mockCreateEndpoint.mockResolvedValueOnce({ endpointArn: "arn" });
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Endpoints/ }));
    await user.click(screen.getByRole("button", { name: /Create endpoint/i }));
    const dlg = modalDlg("Create endpoint");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "ep2");
    await user.type(inputs[1] as HTMLElement, "cfg2");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreateEndpoint).toHaveBeenCalledWith({
        endpointName: "ep2",
        endpointConfigName: "cfg2",
      })
    );
  });

  it("closes the endpoint modal via Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Endpoints/ }));
    await user.click(screen.getByRole("button", { name: /Create endpoint/i }));
    let dlg = modalDlg("Create endpoint");
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create endpoint/i }));
    dlg = modalDlg("Create endpoint");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("deletes an endpoint after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteEndpoint.mockResolvedValueOnce({ ok: true });
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Endpoints/ }));
    await waitFor(() => expect(screen.getByText("ep1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete ep1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteEndpoint).toHaveBeenCalledWith("ep1"));
  });
});

describe("SageMakerDashboard — training jobs tab", () => {
  it("lists training jobs", async () => {
    const user = userEvent.setup();
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Training jobs/ }));
    await waitFor(() => expect(screen.getByText("job1")).toBeTruthy());
    expect(screen.getByText("Completed")).toBeTruthy();
  });

  it("shows Stop only for InProgress jobs and stops it", async () => {
    const user = userEvent.setup();
    mockStopJob.mockResolvedValueOnce({ ok: true });
    mockHooks.useSmTrainingJobs.mockReturnValue(
      listQuery("jobs", [{ ...JOB, TrainingJobStatus: "InProgress" }])
    );
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Training jobs/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Stop/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Stop/i }));
    await waitFor(() => expect(mockStopJob).toHaveBeenCalledWith("job1"));
  });

  it("shows the empty jobs message and renders undefined data", async () => {
    const user = userEvent.setup();
    mockHooks.useSmTrainingJobs.mockReturnValue(
      listQuery("jobs", [], { data: undefined })
    );
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Training jobs/ }));
    await waitFor(() => expect(screen.getByText("No training jobs found")).toBeTruthy());
  });

  it("closes the job modal via Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Training jobs/ }));
    await user.click(screen.getByRole("button", { name: /Create training job/i }));
    let dlg = modalDlg("Create training job");
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create training job/i }));
    dlg = modalDlg("Create training job");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("creates a training job from the modal", async () => {
    const user = userEvent.setup();
    mockCreateJob.mockResolvedValueOnce({ trainingJobArn: "arn" });
    render(<SageMakerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Training jobs/ }));
    await user.click(screen.getByRole("button", { name: /Create training job/i }));
    const dlg = modalDlg("Create training job");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "job2");
    await user.type(inputs[1] as HTMLElement, "img:2");
    await user.type(inputs[2] as HTMLElement, "s3://bucket/train");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreateJob).toHaveBeenCalledWith({
        trainingJobName: "job2",
        algorithmSpecification: { TrainingImage: "img:2", TrainingInputMode: "File" },
        inputDataConfig: [
          {
            ChannelName: "train",
            DataSource: { S3DataSource: { S3Uri: "s3://bucket/train", S3DataType: "S3Prefix" } },
          },
        ],
        outputDataConfig: { S3OutputPath: "s3://bucket/out/job2" },
      })
    );
  });
});

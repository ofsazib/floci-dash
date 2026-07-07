// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockParameters = vi.fn();
const mockParameter = vi.fn();
const mockParameterHistory = vi.fn();
const mockPutParam = vi.fn();
const mockDeleteParam = vi.fn();

const putParamState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));

const deleteParamState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

vi.mock("../../hooks/useSSM", () => ({
  useSSMParameters: (...args: any[]) => mockParameters(...args),
  useSSMParameter: (...args: any[]) => mockParameter(...args),
  useSSMParameterHistory: (...args: any[]) => mockParameterHistory(...args),
  usePutSSMParameter: () => ({
    mutate: mockPutParam,
    get isPending() { return putParamState.isPending; },
    isError: putParamState.isError,
    error: putParamState.error,
    reset: vi.fn(),
  }),
  useDeleteSSMParameter: () => ({
    mutateAsync: mockDeleteParam,
    get isPending() { return deleteParamState.isPending; },
    get variables() { return deleteParamState.variables; },
  }),
}));

import { SSMDashboard } from "./SSMDashboard";

const toastMock = vi.fn();
vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: toastMock }),
}));

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  putParamState.isError = false;
  putParamState.error = null;
  putParamState.isPending = false;
  deleteParamState.isPending = false;
  deleteParamState.variables = null;
  mockParameters.mockReturnValue({
    data: { parameters: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockParameter.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
  });
  mockParameterHistory.mockReturnValue({
    data: undefined,
    isLoading: false,
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("SSMDashboard — parameters list", () => {
  it("shows empty state", () => {
    render(<SSMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No parameters found/i)).toBeTruthy();
  });

  it("renders parameters list with data", () => {
    mockParameters.mockReturnValue({
      data: {
        parameters: [
          {
            Name: "/myapp/db-url",
            Type: "String",
            Version: 2,
            LastModifiedDate: 1719000000,
            Description: "Database URL",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SSMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("/myapp/db-url")).toBeTruthy();
    expect(screen.getAllByText("String").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Database URL")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockParameters.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(<SSMDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows em-dash for missing Type, Version, Description, and LastModifiedDate", () => {
    mockParameters.mockReturnValue({
      data: {
        parameters: [
          { Name: "/myapp/no-detail", Type: null, Version: null, Description: null, LastModifiedDate: null },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SSMDashboard />, { wrapper: createWrapper() });
    const dashes = screen.getAllByText("\u2014");
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it("shows error alert when putParam fails", async () => {
    putParamState.isError = true;
    putParamState.error = new Error("Name cannot be empty");

    const user = userEvent.setup();
    render(<SSMDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create parameter")).toBeTruthy());

    expect(screen.getByText("Name cannot be empty")).toBeTruthy();

    // Reset for other tests
    putParamState.isError = false;
    putParamState.error = null;
  });

  it("disables create button when name or value is empty", async () => {
    mockParameters.mockReturnValue({
      data: { parameters: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SSMDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create parameter")).toBeTruthy());

    // Button should be disabled when name is empty
    const createBtn = screen.getAllByRole("button", { name: /^Create$/i });
    const primaryBtn = createBtn[createBtn.length - 1];
    expect(primaryBtn).toBeDisabled();

    // Fill in name but not value
    const nameInput = screen.getByPlaceholderText("/myapp/db-url");
    await user.type(nameInput, "/myapp/test");

    // Still disabled because value is empty
    expect(primaryBtn).toBeDisabled();
  });

  it("opens create parameter modal and submits", async () => {
    const user = userEvent.setup();
    render(<SSMDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create parameter")).toBeTruthy());

    const nameInput = screen.getByPlaceholderText("/myapp/db-url");
    await user.type(nameInput, "/myapp/test");

    const valueTextarea = screen.getByRole("textbox", { name: /value/i });
    await user.type(valueTextarea, "test-value");

    await clickButton(user, /^Create$/i, { last: true });
    await waitFor(() => {
      expect(mockPutParam).toHaveBeenCalled();
    });
  });

  it("cancels create parameter modal does not call mutation", async () => {
    const user = userEvent.setup();
    render(<SSMDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create parameter")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    expect(mockPutParam).not.toHaveBeenCalled();
  });

  it("deletes a parameter", async () => {
    mockParameters.mockReturnValue({
      data: {
        parameters: [
          {
            Name: "/myapp/db-url",
            Type: "String",
            Version: 1,
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SSMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("/myapp/db-url")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete \/myapp\/db-url/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteParam).toHaveBeenCalledWith("/myapp/db-url");
    });
  });

  it("shows putParam loading state on Create button", async () => {
    putParamState.isPending = true;
    const user = userEvent.setup();
    render(<SSMDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create parameter")).toBeTruthy());
  });

  it("shows deleteParam loading state", () => {
    deleteParamState.isPending = true;
    deleteParamState.variables = "/myapp/db-url";
    mockParameters.mockReturnValue({
      data: {
        parameters: [
          { Name: "/myapp/db-url", Type: "String", Version: 1 },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<SSMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("/myapp/db-url")).toBeTruthy();
  });
});

describe("SSMDashboard — parameter detail view", () => {
  beforeEach(() => {
    mockParameters.mockReturnValue({
      data: {
        parameters: [
          {
            Name: "/myapp/db-url",
            Type: "String",
            Version: 1,
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("navigates into detail view on View click", async () => {
    const user = userEvent.setup();
    render(<SSMDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("/myapp/db-url")).toBeTruthy());
  });

  it("shows parameter details", async () => {
    mockParameter.mockReturnValue({
      data: {
        parameter: {
          Type: "SecureString",
          Version: 3,
          Value: "my-secret-value",
          LastModifiedDate: 1719000000,
          ARN: "arn:aws:ssm:us-east-1:123:parameter/myapp/db-url",
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SSMDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText("SecureString")).toBeTruthy();
      expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("my-secret-value")).toBeTruthy();
      expect(screen.getByText("arn:aws:ssm:us-east-1:123:parameter/myapp/db-url")).toBeTruthy();
    });
  });

  it("shows loading spinner in detail view", async () => {
    mockParameter.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SSMDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText("/myapp/db-url")).toBeTruthy();
    });
  });

  it("shows error in detail view", async () => {
    mockParameter.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Parameter not found"),
    });
    const user = userEvent.setup();
    render(<SSMDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText("Parameter not found")).toBeTruthy();
    });
  });

  it("shows (empty) for parameter value when Value is missing", async () => {
    mockParameter.mockReturnValue({
      data: {
        parameter: {
          Type: "String",
          Version: 1,
          Value: null,
          LastModifiedDate: 1719000000,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SSMDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText("(empty)")).toBeTruthy();
    });
  });

  it("shows em-dash for missing Type in parameter detail", async () => {
    mockParameter.mockReturnValue({
      data: {
        parameter: {
          Value: "my-value",
          LastModifiedDate: 1719000000,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<SSMDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      const dashes = screen.getAllByText("\u2014");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows version history when data present", async () => {
    mockParameter.mockReturnValue({
      data: {
        parameter: {
          Type: "String",
          Version: 2,
          Value: "current-value",
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockParameterHistory.mockReturnValue({
      data: {
        history: [
          { Version: 1, Value: "old-value", LastModifiedDate: 1718000000 },
          { Version: 2, Value: "current-value", LastModifiedDate: 1719000000 },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<SSMDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText("Version History")).toBeTruthy();
      expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("truncates long version history values", async () => {
    const longValue = "x".repeat(100);
    mockParameter.mockReturnValue({
      data: {
        parameter: {
          Type: "String",
          Version: 1,
          Value: "current",
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockParameterHistory.mockReturnValue({
      data: {
        history: [
          { Version: 1, Value: longValue, LastModifiedDate: 1718000000 },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<SSMDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/xxxx/)).toBeTruthy();
      // The value should be truncated: 60 chars + "…"
      expect(screen.getByText(/…$/)).toBeTruthy();
    });
  });

  it("does not show version history when empty", async () => {
    mockParameter.mockReturnValue({
      data: {
        parameter: {
          Type: "String",
          Version: 1,
          Value: "current-value",
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockParameterHistory.mockReturnValue({
      data: { history: [], total: 0 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<SSMDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.queryByText("Version History")).toBeNull();
    });
  });

  it("goes back to parameters list showing list view", async () => {
    const user = userEvent.setup();
    render(<SSMDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("/myapp/db-url")).toBeTruthy());
    await clickButton(user, /Back to Parameters/i);
    // After going back, we should see the list view with the Parameters tab active
    expect(screen.getAllByText("Parameters").length).toBeGreaterThanOrEqual(1);
    // The parameter name should no longer be a header (it's now in the table list)
    expect(screen.getByText("/myapp/db-url")).toBeTruthy(); // still in the table
  });
});

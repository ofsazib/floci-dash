// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";
import { MemoryRouter } from "react-router-dom";

const mockSecrets = vi.fn();
const mockSecret = vi.fn();
const mockSecretValue = vi.fn();
const mockCreateSecret = vi.fn();
const mockDeleteSecret = vi.fn();
const mockRestoreSecret = vi.fn();
const mockPutSecretValue = vi.fn();
const mockRandomPassword = vi.fn();

vi.mock("../hooks/useSecrets", () => ({
  useSecrets: (...args: any[]) => mockSecrets(...args),
  useSecret: (...args: any[]) => mockSecret(...args),
  useSecretValue: (...args: any[]) => mockSecretValue(...args),
  useCreateSecret: () => ({ mutateAsync: mockCreateSecret, isPending: false, isError: false, error: null }),
  useDeleteSecret: () => ({ mutateAsync: mockDeleteSecret, isPending: false }),
  useRestoreSecret: () => ({ mutateAsync: mockRestoreSecret, isPending: false }),
  usePutSecretValue: () => ({ mutateAsync: mockPutSecretValue, isPending: false }),
  useRandomPassword: () => ({ mutateAsync: mockRandomPassword, isPending: false, data: null }),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await import("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

import SecretsManagerPage from "./SecretsManagerPage";

function pageWrapper() {
  const Wrapper = createWrapper();
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <Wrapper>{children}</Wrapper>
    </MemoryRouter>
  );
}

const defaultSecret = {
  name: "my-secret",
  arn: "arn:aws:secretsmanager:us-east-1::secret:my-secret",
  description: "Test secret",
  rotationEnabled: true,
  createdDate: new Date("2025-01-01"),
  lastChangedDate: new Date("2025-06-01"),
  tags: [{ key: "env", value: "prod" }],
};

describe("SecretsManagerPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSecrets.mockReturnValue({
      data: { secrets: [defaultSecret], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockSecret.mockReturnValue({
      data: { secret: defaultSecret, versions: [{ versionId: "v1", stages: ["AWSCURRENT"], createdDate: new Date("2025-01-01") }], versionIdsToStages: { v1: ["AWSCURRENT"] } },
      isLoading: false, isError: false, error: null,
    });
    mockSecretValue.mockReturnValue({
      data: { secretString: "my-super-secret-value", versionId: "v1", versionStages: ["AWSCURRENT"] },
      isLoading: false, isError: false, error: null,
    });
    mockCreateSecret.mockResolvedValue({});
    mockDeleteSecret.mockResolvedValue({});
    mockRestoreSecret.mockResolvedValue({});
    mockPutSecretValue.mockResolvedValue({});
    mockRandomPassword.mockResolvedValue({ randomPassword: "R@nd0m!Pass" });
  });

  it("renders secret list", () => {
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    expect(screen.getAllByText("Secrets Manager").length).toBeGreaterThan(0);
    expect(screen.getAllByText("my-secret").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Test secret").length).toBeGreaterThan(0);
    expect(screen.getAllByText("(1)").length).toBeGreaterThan(0);
  });

  it("renders empty state when no secrets", () => {
    mockSecrets.mockReturnValue({ data: { secrets: [], total: 0 }, isLoading: false, isError: false, error: null });
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /Secrets Manager/i, level: 1 })).toBeTruthy();
    expect(screen.getByText("No secrets")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockSecrets.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /Secrets Manager/i, level: 1 })).toBeTruthy();
  });

  it("renders without crashing in error state", () => {
    mockSecrets.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load secrets") });
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /Secrets Manager/i, level: 1 })).toBeTruthy();
  });

  it("shows create secret button", () => {
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("button", { name: /Create secret/i })).toBeTruthy();
  });

  it("renders rotation badge when enabled", () => {
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("Enabled")).toBeTruthy();
  });

  it("renders rotation badge as Off when disabled", () => {
    mockSecrets.mockReturnValue({
      data: { secrets: [{ ...defaultSecret, rotationEnabled: false }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("Off")).toBeTruthy();
  });

  it("renders tags in the table", () => {
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("env")).toBeTruthy();
  });

  it("shows dash when description is missing", () => {
    mockSecrets.mockReturnValue({
      data: { secrets: [{ ...defaultSecret, description: undefined }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("opens create modal when Create secret is clicked", async () => {
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create secret/i);
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("my-app/db-password").length).toBeGreaterThan(0);
    });
  });

  it("create modal generates random password", async () => {
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create secret/i);
    await waitFor(() => {
      expect(screen.getAllByText("Generate password").length).toBeGreaterThan(0);
    });
    await clickButton(user, /Generate password/i);
    await waitFor(() => {
      expect(mockRandomPassword).toHaveBeenCalledWith({});
    });
  });

  it("opens detail modal when View is clicked", async () => {
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getAllByText(/Secret: my-secret/i).length).toBeGreaterThan(0);
    });
  });

  it("detail modal shows overview tab with secret info", async () => {
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getAllByText("arn:aws:secretsmanager:us-east-1::secret:my-secret").length).toBeGreaterThan(0);
    });
  });

  it("detail modal shows secret value tab with reveal/hide", async () => {
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getAllByText(/Secret: my-secret/i).length).toBeGreaterThan(0);
    });
    await user.click(screen.getByRole("tab", { name: /Secret value/i }));
    await waitFor(() => {
      expect(screen.getAllByText("Reveal").length).toBeGreaterThan(0);
    });
    await clickButton(user, /Reveal/i);
    await waitFor(() => {
      expect(screen.getAllByText("my-super-secret-value").length).toBeGreaterThan(0);
    });
    await clickButton(user, /Hide/i);
    expect(screen.getAllByText("Reveal").length).toBeGreaterThan(0);
  });

  it("detail modal puts new secret value", async () => {
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getAllByText(/Secret: my-secret/i).length).toBeGreaterThan(0);
    });
    await user.click(screen.getByRole("tab", { name: /Secret value/i }));
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Put value/i }).length).toBeGreaterThan(0);
    });
    const textareas = screen.getAllByRole("textbox");
    const putValueTextarea = textareas[textareas.length - 1];
    await user.type(putValueTextarea, "new-version-value");
    await clickButton(user, /Put value/i);
    await waitFor(() => {
      expect(mockPutSecretValue).toHaveBeenCalledWith({ id: "my-secret", secretString: "new-version-value" });
    });
  });

  it("detail modal shows versions tab", async () => {
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getAllByText(/Secret: my-secret/i).length).toBeGreaterThan(0);
    });
    await user.click(screen.getByRole("tab", { name: /Versions/i }));
    await waitFor(() => {
      expect(screen.getAllByText("v1").length).toBeGreaterThan(0);
    });
  });

  it("detail modal shows tags tab", async () => {
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getAllByText(/Secret: my-secret/i).length).toBeGreaterThan(0);
    });
    await user.click(screen.getByRole("tab", { name: /Tags/i }));
    await waitFor(() => {
      expect(screen.getAllByText("env: prod").length).toBeGreaterThan(0);
    });
  });

  it("shows Restore button for deleted secrets", async () => {
    mockSecrets.mockReturnValue({
      data: { secrets: [{ ...defaultSecret, deletedDate: new Date("2025-06-15") }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    expect(screen.getAllByRole("button", { name: /Restore/i }).length).toBeGreaterThan(0);
  });

  it("calls restoreSecret when Restore is clicked", async () => {
    const user = userEvent.setup();
    mockSecrets.mockReturnValue({
      data: { secrets: [{ ...defaultSecret, deletedDate: new Date("2025-06-15") }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Restore/i);
    await waitFor(() => {
      expect(mockRestoreSecret).toHaveBeenCalledWith("my-secret");
    });
  });

  it("deletes a secret via DeleteButton", async () => {
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    const deleteButton = screen.getByRole("button", { name: /Delete my-secret/i });
    await user.click(deleteButton);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Delete$/i })).toBeTruthy();
    });
    await clickButton(user, /Delete$/i);
    await waitFor(() => {
      expect(mockDeleteSecret).toHaveBeenCalledWith({ id: "my-secret", force: true });
    });
  });
});

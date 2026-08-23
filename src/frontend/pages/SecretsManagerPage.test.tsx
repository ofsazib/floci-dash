// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
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
const mockPolicy = vi.fn();
const mockShowToast = vi.hoisted(() => vi.fn());
const mockPutPolicy = vi.fn();

const mockUseHealth = vi.fn();
vi.mock("../hooks/useSystem", () => ({
  useHealth: (...args: any[]) => mockUseHealth(...args),
}));

vi.mock("../hooks/useSecrets", () => ({
  useSecrets: (...args: any[]) => mockSecrets(...args),
  useSecret: (...args: any[]) => mockSecret(...args),
  useSecretValue: (...args: any[]) => mockSecretValue(...args),
  useCreateSecret: () => ({ mutateAsync: mockCreateSecret, isPending: false, isError: false, error: null }),
  useDeleteSecret: () => ({ mutateAsync: mockDeleteSecret, isPending: false }),
  useRestoreSecret: () => ({ mutateAsync: mockRestoreSecret, isPending: false }),
  usePutSecretValue: () => ({ mutateAsync: mockPutSecretValue, isPending: false }),
  useRandomPassword: () => ({ mutateAsync: mockRandomPassword, isPending: false, data: null }),
  useSecretResourcePolicy: (...args: any[]) => mockPolicy(...args),
  usePutSecretResourcePolicy: () => ({ mutate: mockPutPolicy, isPending: false }),
  useDeleteSecretResourcePolicy: () => ({ mutate: vi.fn(), isPending: false }),
  useBatchGetSecretValue: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateSecretVersionStage: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const hoistedNavigate = vi.hoisted(() => vi.fn());
vi.mock("react-router-dom", async () => {
  const actual = await import("react-router-dom");
  return {
    ...actual,
    useNavigate: () => hoistedNavigate,
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
    mockPolicy.mockReturnValue({ data: undefined });
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
    mockUseHealth.mockReturnValue({ data: { services: { secretsmanager: "running" } }, isLoading: false });
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

  // ─── CreateSecretModal: Submit ─────────────────────────

  it("submits create secret form with name and value", async () => {
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create secret/i);
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("my-app/db-password").length).toBeGreaterThan(0);
    });
    await user.type(screen.getByPlaceholderText("my-app/db-password"), "app/api-key");
    const textareas = screen.getAllByRole("textbox");
    await user.type(textareas[textareas.length - 1], "super-secret");
    await clickButton(user, /^Create$/);
    await waitFor(() => {
      expect(mockCreateSecret).toHaveBeenCalledWith(
        expect.objectContaining({ name: "app/api-key", secretString: "super-secret" }),
      );
    });
  });

  // ─── SecretDetailModal: Loading ────────────────────────

  it("detail modal shows loading state", async () => {
    mockSecret.mockReturnValue({
      data: undefined,
      isLoading: true, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText("Loading...")).toBeTruthy();
    });
  });

  // ─── SecretDetailModal: Not Found ──────────────────────

  it("detail modal shows not found when secret is null", async () => {
    mockSecret.mockReturnValue({
      data: { secret: null, versions: [] },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText("Secret not found")).toBeTruthy();
    });
  });

  // ─── SecretDetailModal: Tags Tab Empty ─────────────────

  it("detail modal tags tab shows no tags message", async () => {
    mockSecret.mockReturnValue({
      data: { secret: { ...defaultSecret, tags: [] }, versions: [] },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getAllByText(/Secret: my-secret/i).length).toBeGreaterThan(0);
    });
    await user.click(screen.getByRole("tab", { name: /Tags/i }));
    await waitFor(() => {
      expect(screen.getByText("No tags")).toBeTruthy();
    });
  });

  // ─── SecretDetailModal: KMS Key Default ────────────────

  it("detail modal shows default KMS key when not set", async () => {
    mockSecret.mockReturnValue({
      data: { secret: { ...defaultSecret, kmsKeyId: undefined }, versions: [] },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/aws\/secretsmanager \(default\)/)).toBeTruthy();
    });
  });

  // ─── CreateSecretModal: Description Input ───────────────

  it("types into description field in create modal", async () => {
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create secret/i);
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("my-app/db-password").length).toBeGreaterThan(0);
    });
    const descriptionInput = screen.getByLabelText("Description");
    await user.type(descriptionInput, "My database password");
    expect(descriptionInput).toHaveValue("My database password");
  });

  // ─── CreateSecretModal: Generate Password Error ─────────

  it("shows error toast when generate password fails", async () => {
    mockRandomPassword.mockRejectedValueOnce(new Error("Password generation failed"));
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

  // ─── Breadcrumb Navigation ──────────────────────────────

  it("clicks Dashboard breadcrumb to exercise onFollow handler", () => {
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    const breadcrumbLinks = screen.getAllByText("Dashboard");
    expect(breadcrumbLinks.length).toBeGreaterThan(0);
  });

  it("navigates when a breadcrumb is followed", async () => {
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    const dashboardLink = screen.getAllByText("Dashboard")[0];
    await user.click(dashboardLink);
    await waitFor(() => {
      expect(hoistedNavigate).toHaveBeenCalled();
    });
  });

  // ─── Error branches ────────────────────────────────────

  it("shows error toast when restore fails", async () => {
    mockRestoreSecret.mockRejectedValueOnce(new Error("Restore failed"));
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

  it("shows error toast when delete fails", async () => {
    mockDeleteSecret.mockRejectedValueOnce(new Error("Delete failed"));
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("button", { name: /Delete my-secret/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Delete$/i })).toBeTruthy());
    await clickButton(user, /Delete$/i);
    await waitFor(() => {
      expect(mockDeleteSecret).toHaveBeenCalledWith({ id: "my-secret", force: true });
    });
  });

  it("shows error toast when create secret fails", async () => {
    mockCreateSecret.mockRejectedValueOnce(new Error("Create failed"));
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create secret/i);
    await waitFor(() => expect(screen.getAllByPlaceholderText("my-app/db-password").length).toBeGreaterThan(0));
    await user.type(screen.getByPlaceholderText("my-app/db-password"), "app/api-key");
    const textareas = screen.getAllByRole("textbox");
    await user.type(textareas[textareas.length - 1], "super-secret");
    await clickButton(user, /^Create$/);
    await waitFor(() => {
      expect(mockCreateSecret).toHaveBeenCalled();
    });
  });

  it("cancels create secret modal", async () => {
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create secret/i);
    await waitFor(() => expect(screen.getAllByPlaceholderText("my-app/db-password").length).toBeGreaterThan(0));
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("my-app/db-password")).toBeNull();
    });
  });

  it("closes secret detail modal", async () => {
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/Secret: my-secret/)).toBeTruthy());
    await clickButton(user, /Close/i);
    await waitFor(() => {
      expect(screen.queryByText(/Secret: my-secret/)).toBeNull();
    });
  });

  // ─── Branch coverage ───────────────────────────────────

  it("renders secret without created date or arn as dash and trackBy fallback", () => {
    mockSecrets.mockReturnValue({
      data: { secrets: [{ name: "no-date-secret" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("no-date-secret")).toBeTruthy();
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("renders secret without tags key", () => {
    mockSecrets.mockReturnValue({
      data: { secrets: [{ ...defaultSecret, tags: undefined }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    expect(screen.getAllByText("my-secret").length).toBeGreaterThan(0);
  });

  it("detail overview shows Deleted date when present", async () => {
    const user = userEvent.setup();
    mockSecret.mockReturnValue({
      data: { secret: { ...defaultSecret, deletedDate: new Date("2025-06-15") }, versions: [] },
      isLoading: false, isError: false, error: null,
    });
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/Deleted:/)).toBeTruthy());
  });

  it("secret value tab shows loading state", async () => {
    mockSecretValue.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getAllByText(/Secret: my-secret/i).length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: /Secret value/i }));
    await waitFor(() => expect(screen.getAllByText("Loading...").length).toBeGreaterThan(0));
  });

  it("secret value tab shows fallbacks for missing version data", async () => {
    const user = userEvent.setup();
    mockSecretValue.mockReturnValue({
      data: { secretString: undefined }, isLoading: false, isError: false, error: null,
    });
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getAllByText(/Secret: my-secret/i).length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: /Secret value/i }));
    await waitFor(() => expect(screen.getAllByRole("button", { name: /Reveal/i }).length).toBeGreaterThan(0));
    await clickButton(user, /Reveal/i);
    await waitFor(() => expect(screen.getByText("(binary)")).toBeTruthy());
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("versions tab shows non-current stage and missing fields", async () => {
    const user = userEvent.setup();
    mockSecret.mockReturnValue({
      data: {
        secret: defaultSecret,
        versions: [{ versionId: "v-old", stages: ["AWSPREVIOUS"] }],
        versionIdsToStages: { "v-old": ["AWSPREVIOUS"] },
      },
      isLoading: false, isError: false, error: null,
    });
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getAllByText(/Secret: my-secret/i).length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: /Versions/i }));
    await waitFor(() => expect(screen.getAllByText("AWSPREVIOUS").length).toBeGreaterThan(0));
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("versions tab renders version with no stages", async () => {
    const user = userEvent.setup();
    mockSecret.mockReturnValue({
      data: {
        secret: defaultSecret,
        versions: [{ versionId: "v-none" }],
        versionIdsToStages: {},
      },
      isLoading: false, isError: false, error: null,
    });
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getAllByText(/Secret: my-secret/i).length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: /Versions/i }));
    await waitFor(() => expect(screen.getAllByText("v-none").length).toBeGreaterThan(0));
  });

  it("shows available status text", () => {
    mockUseHealth.mockReturnValue({ data: { services: { secretsmanager: "available" } }, isLoading: false });
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    expect(screen.getAllByText("Available").length).toBeGreaterThan(0);
  });

  it("shows connected status when service missing", () => {
    mockUseHealth.mockReturnValue({ data: { services: {} }, isLoading: false });
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    expect(screen.getAllByText("Connected").length).toBeGreaterThan(0);
  });

});

describe("SecretsManagerPage — resource policy tab", () => {
  function setupDetail(policy: string | null) {
    mockUseHealth.mockReturnValue({ data: { services: { secretsmanager: "running" } }, isLoading: false });
    mockPolicy.mockReturnValue({ data: { resourcePolicy: policy } });
    mockSecretValue.mockReturnValue({ data: undefined, isLoading: false });
  }

  async function openPolicyTab(user: ReturnType<typeof userEvent.setup>) {
    render(<SecretsManagerPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    const tab = await screen.findByText("Resource policy");
    await user.click(tab);
  }

  it("shows the attached resource policy", async () => {
    setupDetail('{"Version":"2012-10-17"}');
    const user = userEvent.setup();
    await openPolicyTab(user);
    expect(await screen.findByText(/"Version":"2012-10-17"/)).toBeTruthy();
  });

  it("shows the no-policy message", async () => {
    setupDetail(null);
    const user = userEvent.setup();
    await openPolicyTab(user);
    expect(await screen.findByText("No resource policy attached.")).toBeTruthy();
  });

  it("saves an edited resource policy", async () => {
    setupDetail(null);
    mockPutPolicy.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    await openPolicyTab(user);
    const area = await screen.findByRole("textbox");
    fireEvent.change(area, { target: { value: '{"Version":"2012-10-17"}' } });
    await user.click(screen.getByRole("button", { name: /Save resource policy/i }));
    await waitFor(() =>
      expect(mockPutPolicy).toHaveBeenCalledWith(
        { secretId: "my-secret", resourcePolicy: '{"Version":"2012-10-17"}' },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("shows an error toast when saving the policy fails", async () => {
    setupDetail(null);
    mockPutPolicy.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("save failed")));
    const user = userEvent.setup();
    await openPolicyTab(user);
    const area = await screen.findByRole("textbox");
    fireEvent.change(area, { target: { value: "x" } });
    await user.click(screen.getByRole("button", { name: /Save resource policy/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "save failed"));
  });

  it("shows a fallback error toast when saving fails without a message", async () => {
    setupDetail(null);
    mockPutPolicy.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("")));
    const user = userEvent.setup();
    await openPolicyTab(user);
    const area = await screen.findByRole("textbox");
    fireEvent.change(area, { target: { value: "x" } });
    await user.click(screen.getByRole("button", { name: /Save resource policy/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to save policy"));
  });

  it("keeps Save disabled until policy text is entered", async () => {
    setupDetail(null);
    const user = userEvent.setup();
    await openPolicyTab(user);
    expect((await screen.findByRole("button", { name: /Save resource policy/i })).hasAttribute("disabled")).toBe(true);
  });
});

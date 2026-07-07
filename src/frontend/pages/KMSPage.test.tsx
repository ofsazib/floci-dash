// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";
import { MemoryRouter } from "react-router-dom";

const mockKeys = vi.fn();
const mockKeyDetail = vi.fn();
const mockCreateKey = vi.fn();
const mockScheduleKeyDeletion = vi.fn();
const mockCancelKeyDeletion = vi.fn();
const mockToggleKey = vi.fn();
const mockToggleRotation = vi.fn();
const mockUpdateKeyDescription = vi.fn();
const mockAliases = vi.fn();
const mockCreateAlias = vi.fn();
const mockDeleteAlias = vi.fn();
const mockEncrypt = vi.fn();
const mockDecrypt = vi.fn();

vi.mock("../hooks/useKMS", () => ({
  useKMSKeys: (...args: any[]) => mockKeys(...args),
  useKMSKey: (...args: any[]) => mockKeyDetail(...args),
  useCreateKey: () => ({ mutate: mockCreateKey, mutateAsync: mockCreateKey, isPending: false, isError: false, error: null }),
  useScheduleKeyDeletion: () => ({ mutate: mockScheduleKeyDeletion, isPending: false }),
  useCancelKeyDeletion: () => ({ mutate: mockCancelKeyDeletion, isPending: false }),
  useToggleKey: () => ({ mutate: mockToggleKey, isPending: false }),
  useToggleRotation: () => ({ mutate: mockToggleRotation, isPending: false }),
  useUpdateKeyDescription: () => ({ mutate: mockUpdateKeyDescription, isPending: false }),
  useKMSAliases: (...args: any[]) => mockAliases(...args),
  useCreateAlias: () => ({ mutate: mockCreateAlias, isPending: false }),
  useDeleteAlias: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEncrypt: () => ({ mutate: mockEncrypt, mutateAsync: vi.fn(), isPending: false, data: null }),
  useDecrypt: () => ({ mutate: mockDecrypt, mutateAsync: vi.fn(), isPending: false, data: null }),
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

import KMSPage from "./KMSPage";

function pageWrapper() {
  const Wrapper = createWrapper();
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <Wrapper>{children}</Wrapper>
    </MemoryRouter>
  );
}

describe("KMSPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKeys.mockReturnValue({
      data: { keys: [{ keyId: "1234-abcd", arn: "arn:aws:kms:us-east-1::key/1234-abcd", keyManager: "CUSTOMER", keyState: "Enabled", description: "My key", keySpec: "SYMMETRIC_DEFAULT" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    mockAliases.mockReturnValue({
      data: { aliases: [{ name: "alias/my-key", targetKeyId: "1234-abcd" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
  });

  it("renders key list", () => {
    render(<KMSPage />, { wrapper: pageWrapper() });
    expect(screen.getAllByText("KMS").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1234-abcd").length).toBeGreaterThan(0);
  });

  it("renders empty key list when no data", () => {
    mockKeys.mockReturnValue({ data: { keys: [], total: 0 }, isLoading: false, isError: false, error: null });
    render(<KMSPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /KMS Keys/i, level: 2 })).toBeTruthy();
  });

  it("shows create key button", () => {
    render(<KMSPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("button", { name: /Create key/i })).toBeTruthy();
  });

  it("shows loading state", () => {
    mockKeys.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<KMSPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /KMS Keys/i, level: 2 })).toBeTruthy();
  });

  it("renders without crashing in error state", () => {
    mockKeys.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load keys") });
    render(<KMSPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /KMS Keys/i, level: 2 })).toBeTruthy();
  });

  it("opens key detail modal when View is clicked", async () => {
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getAllByText(/KMS Key:/i).length).toBeGreaterThan(0);
    });
  });

  it("renders aliases tab with alias data", async () => {
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Aliases/i }));
    await waitFor(() => {
      expect(screen.getAllByText("alias/my-key").length).toBeGreaterThan(0);
    });
  });

  it("opens create key modal when Create key is clicked", async () => {
    const user = userEvent.setup();
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create key/i);
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("My encryption key").length).toBeGreaterThan(0);
    });
  });

  it("shows enable action button for a disabled key in detail modal", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Disabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Enable/i }).length).toBeGreaterThan(0);
    });
  });

  it("shows Schedule deletion button in detail modal", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Schedule deletion/i })).toBeTruthy();
    });
  });

  it("shows Cancel deletion button for PendingDeletion key", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "PendingDeletion", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Cancel deletion/i })).toBeTruthy();
    });
  });

  it("shows rotation toggle button for enabled key", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Enable rotation/i })).toBeTruthy();
    });
  });

  it("shows Disable rotation button for key with rotation enabled", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: true },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Disable rotation/i })).toBeTruthy();
    });
  });

  it("shows Edit description button in detail modal", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Edit description/i })).toBeTruthy();
    });
  });

  it("shows Aliases, Grants, and Encrypt/Decrypt tabs in detail modal", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [{ name: "alias/my-key", arn: "arn:aws:kms:alias/my-key", creationDate: "2025-01-01" }], grants: [{ grantId: "grant-1", name: "test-grant", granteePrincipal: "user", operations: ["Encrypt"], creationDate: "2025-01-01" }], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/KMS Key:/i)).toBeTruthy();
    });
    // Check aliases tab
    expect(screen.getByRole("tab", { name: /Aliases/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Grants/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Encrypt \/ Decrypt/i })).toBeTruthy();
  });

  it("shows tags in the key detail modal", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: { env: "prod", team: "core" }, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/env/)).toBeTruthy();
      expect(screen.getByText(/prod/)).toBeTruthy();
      expect(screen.getByText(/team/)).toBeTruthy();
      expect(screen.getByText(/core/)).toBeTruthy();
    });
  });

  it("shows 'No aliases' for empty aliases tab", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/KMS Key:/i)).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Aliases/i }));
    await waitFor(() => {
      expect(screen.getByText("No aliases")).toBeTruthy();
    });
  });

  it("shows 'No grants' for empty grants tab", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/KMS Key:/i)).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Grants/i }));
    await waitFor(() => {
      expect(screen.getByText("No grants")).toBeTruthy();
    });
  });

  it("shows Encrypt/Decrypt tab and encrypt button", async () => {
    const user = userEvent.setup();
    mockKeyDetail.mockReturnValue({
      data: { key: { keyId: "1234-abcd", keyState: "Enabled", description: "My key" }, tags: {}, aliases: [], grants: [], rotationEnabled: false },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/KMS Key:/i)).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Encrypt \/ Decrypt/i }));
    await waitFor(() => {
      const encryptBtn = screen.getByRole("button", { name: /Encrypt/i });
      expect(encryptBtn).toBeTruthy();
    });
    expect(screen.getByPlaceholderText("SGVsbG8gV29ybGQ=")).toBeTruthy();
  });

  it("shows aliases tab with alias list and create alias button", async () => {
    const user = userEvent.setup();
    mockAliases.mockReturnValue({
      data: { aliases: [{ name: "alias/my-key", targetKeyId: "1234-abcd" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Aliases/i }));
    await waitFor(() => {
      expect(screen.getByText("alias/my-key")).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: /Create alias/i })).toBeTruthy();
  });

  it("opens create alias modal", async () => {
    const user = userEvent.setup();
    mockAliases.mockReturnValue({
      data: { aliases: [], total: 0 },
      isLoading: false, isError: false, error: null,
    });
    render(<KMSPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Aliases/i }));
    await waitFor(() => {
      expect(screen.getByText("No aliases")).toBeTruthy();
    });
    await user.click(screen.getByRole("button", { name: /Create alias/i }));
    await waitFor(() => {
      expect(screen.getByText("Create alias")).toBeTruthy();
    });
  });
});
